const Booking = require('../models/Booking');
const Helper = require('../models/Helper');

// Render booking form for a helper
exports.renderBookingForm = async (req, res) => {
  try {
    const helper = await Helper.findById(req.params.helperId);
    if (!helper) return res.status(404).render('error', { error: 'Helper not found' });
    // Only allow booking for helpers that completed profiles
    const isProfileComplete = (
      helper.phone &&
      helper.category &&
      helper.hourlyRate &&
      helper.location &&
      helper.location.area &&
      helper.location.city &&
      helper.location.pincode
    );
    if (!isProfileComplete) {
      return res.status(400).render('error', { error: 'Helper profile incomplete. Cannot book.' });
    }
    res.render('booking/create', { helper, user: req.session.user });
  } catch (err) {
    res.status(500).render('error', { error: 'Could not load booking form' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { helperId, bookingDate, startHour, startMinute, ampm, duration, street, area, city, pincode, instructions } = req.body;
    const userId = req.session.user?._id;
    if (!userId) {
      req.flash('error_msg', 'User not authenticated');
      return res.redirect('/auth/login');
    }
    if (!helperId || !bookingDate || !startHour || !startMinute || !ampm || !duration || !street || !city) {
      req.flash('error_msg', 'Missing required fields');
      return res.redirect('back');
    }
    const hourNum = parseInt(startHour);
    const minuteNum = parseInt(startMinute);
    if (hourNum < 1 || hourNum > 12 || minuteNum < 0 || minuteNum > 59) {
      req.flash('error_msg', 'Invalid time');
      return res.redirect('back');
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
      req.flash('error_msg', 'Pincode must be 6 digits');
      return res.redirect('back');
    }
    const helper = await Helper.findById(helperId);
    if (!helper) {
      req.flash('error_msg', 'Helper not found');
      return res.redirect('back');
    }
    // Only allow booking if helper is available
    if (helper.availability !== 'available') {
      req.flash('error_msg', 'Helper not available');
      return res.redirect('back');
    }
    // Ensure profile is complete before booking
    const isProfileComplete =
      helper.phone &&
      helper.category &&
      helper.hourlyRate &&
      helper.location &&
      helper.location.area &&
      helper.location.city &&
      helper.location.pincode;

    if (!isProfileComplete) {
      req.flash('error_msg', 'Helper profile is incomplete. Cannot book.');
      return res.redirect('back');
    }

    let hour24 = hourNum;
    if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
    if (ampm === 'AM' && hour24 === 12) hour24 = 0;
    const formattedTime = `${hour24.toString().padStart(2, '0')}:${startMinute.padStart(2, '0')}`;
    const displayTime = `${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')} ${ampm}`;
    const totalAmount = helper.hourlyRate * Number(duration);
    const address = {
      street: street.trim(),
      area: area ? area.trim() : 'Not specified',
      city: city.trim(),
      pincode: pincode ? pincode.trim() : 'Not specified'
    };

    const booking = new Booking({
      userId,
      helperId,
      bookingDate: new Date(bookingDate),
      startTime: displayTime,
      startTime24: formattedTime,
      duration: Number(duration),
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'pending',
      address,
      specialInstructions: instructions ? instructions.trim() : ''
    });

    const savedBooking = await booking.save();
    // Set helper status to busy
    await Helper.findByIdAndUpdate(helperId, { availability: 'busy' });

    req.flash('success_msg', 'Booking created');
    res.redirect(`/booking/confirmation/${savedBooking._id}`);
  } catch (err) {
    req.flash('error_msg', 'Could not create booking');
    res.redirect('back');
  }
};

exports.showConfirmation = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('helperId')
      .populate('userId');
    if (!booking) return res.status(404).render('error', { error: 'Booking not found' });
    if (req.session.user && String(booking.userId._id) !== String(req.session.user._id)) {
      return res.status(403).render('error', { error: 'Access denied for this booking' });
    }
    if (!booking.helperId) {
      return res.status(404).render('error', { error: 'Helper info missing' });
    }
    booking.bookingDate = booking.bookingDate instanceof Date
      ? booking.bookingDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      : booking.bookingDate;
    res.render('booking/confirmation', { booking, helper: booking.helperId, user: req.session.user });
  } catch (err) {
    res.status(500).render('error', { error: 'Could not load confirmation' });
  }
};

exports.showLatestConfirmation = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) return res.status(401).render('error', { error: 'Not authenticated' });
    const booking = await Booking.findOne({ userId }).sort({ createdAt: -1 }).populate('helperId').populate('userId');
    if (!booking) return res.status(404).render('error', { error: 'No recent booking' });
    booking.bookingDate = booking.bookingDate instanceof Date
      ? booking.bookingDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      : booking.bookingDate;
    res.render('booking/confirmation', { booking, helper: booking.helperId, user: req.session.user });
  } catch (err) {
    res.status(500).render('error', { error: 'Could not load confirmation' });
  }
};

// Mark booking complete and free helper
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.bookingId;
    const booking = await Booking.findById(bookingId).populate('helperId');
    if (!booking) return res.status(404).render('error', { error: 'Booking not found' });
    booking.status = status || booking.status;
    await booking.save();
    if ((status === 'completed' || status === 'cancelled') && booking.helperId) {
      await Helper.findByIdAndUpdate(booking.helperId._id, { availability: 'available' });
    }
    res.json({ message: 'Booking status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update booking' });
  }
};

exports.listUserBookings = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) {
      return res.status(401).render('error', { error: 'Login required' });
    }
    const bookings = await Booking.find({ userId })
      .populate('helperId')
      .sort({ createdAt: -1 });
    const formattedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      bookingDate: booking.bookingDate instanceof Date
        ? booking.bookingDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        : booking.bookingDate
    }));
    res.render('booking/list', { bookings: formattedBookings, user: req.session.user });
  } catch (err) {
    res.status(500).render('error', { error: 'Could not load bookings' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).render('error', { error: 'Booking not found' });
    if (!req.session.user || String(booking.userId) !== String(req.session.user._id)) {
      return res.status(403).render('error', { error: 'Booking access denied' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).render('error', { error: 'Already cancelled' });
    }
    if (booking.status === 'completed') {
      return res.status(400).render('error', { error: 'Completed booking' });
    }
    await Booking.findByIdAndUpdate(req.params.bookingId, { status: 'cancelled', cancelledAt: new Date() });
    await Helper.findByIdAndUpdate(booking.helperId, { availability: 'available' });
    req.flash('success_msg', 'Booking cancelled');
    res.redirect('/booking');
  } catch (err) {
    req.flash('error_msg', 'Could not cancel booking');
    res.redirect('/booking');
  }
};
