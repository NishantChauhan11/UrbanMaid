const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const Booking = require('../models/Booking');

router.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

function requireAuth(req, res, next) {
  if (req.session.user && req.session.user._id && req.session.user.role === 'user') return next();
  req.flash('error_msg', 'Please log in as user');
  res.redirect('/auth/login');
}

router.get('/', requireAuth, bookingController.listUserBookings);
router.get('/create/:helperId', requireAuth, bookingController.renderBookingForm);
router.post('/', requireAuth, bookingController.createBooking); // Controller must set status: 'confirmed'
router.get('/confirmation/:bookingId', requireAuth, bookingController.showConfirmation);
router.get('/confirmation', requireAuth, bookingController.showLatestConfirmation);
router.get('/my-bookings', requireAuth, bookingController.listUserBookings);

router.post('/:bookingId/accept', async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.bookingId, { status: 'accepted' });
  req.flash('success_msg', 'Booking accepted');
  res.redirect('back');
});

router.post('/:bookingId/reject', async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.bookingId, { status: 'rejected' });
  req.flash('success_msg', 'Booking rejected');
  res.redirect('back');
});

router.post('/confirm', requireAuth, async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    req.flash('error_msg', 'Booking ID is required');
    return res.redirect('back');
  }
  await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed' });
  req.flash('success_msg', 'Booking confirmed');
  res.redirect(`/booking/confirmation/${bookingId}`);
});

module.exports = router;
