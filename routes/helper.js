const express = require('express');
const router = express.Router();
const Helper = require('../models/Helper');
const Booking = require('../models/Booking');
const multer = require('multer');
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

function isAuthenticated(req, res, next) {
  if (req.session?.user) return next();
  req.flash('error_msg', 'Please log in to access this page.');
  res.redirect('/auth/login');
}

function isHelperAuthenticated(req, res, next) {
  if (req.session?.user && req.session.user.role === 'helper') return next();
  req.flash('error_msg', 'Please log in as a helper to access this page.');
  res.redirect('/auth/login');
}

router.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.isAuthenticated = !!req.session?.user;
  next();
});

router.get('/', async (req, res) => {
  if (req.session?.user && req.session.user.role === 'helper') {
    return res.redirect('/helper/dashboard');
  }
  try {
    const helpers = await Helper.find({});
    res.render('helper/list', {
      title: 'All Helpers - UrbanMaid',
      helpers,
      user: req.session?.user || null,
      isAuthenticated: !!req.session?.user
    });
  } catch (err) {
    res.status(500).render('error', { error: err.message || 'Could not load helpers.' });
  }
});

router.get('/profile', isHelperAuthenticated, (req, res) => {
  res.render('helper/joinashelper', {
    title: 'Complete Your Profile - UrbanMaid',
    user: req.session.user
  });
});

router.post('/profile', isHelperAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { phone, category, experience, hourlyRate, area, city, pincode, description } = req.body;
    const validCategories = [
      'maid', 'cook', 'babysitter', 'cleaner', 'plumber', 'electrician', 'gardener', 'driver'
    ];
    if (!category || !validCategories.includes(category)) {
      req.flash('error_msg', 'Please select a valid category.');
      return res.redirect('/helper/profile');
    }
    let imageURL = '';
    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname
      });
      imageURL = uploadResponse.url;
    }
    await Helper.updateOne(
      { _id: req.session.user._id },
      {
        phone,
        category,
        experience: Number(experience) || 0,
        hourlyRate: Number(hourlyRate),
        location: {
          area: area?.trim() || '',
          city: city?.trim() || '',
          pincode: pincode?.trim() || ''
        },
        description: description || '',
        imageURL,
        isActive: true
      }
    );
    req.flash('success_msg', 'Profile completed! You are now a helper.');
    res.redirect('/helper/dashboard');
  } catch (err) {
    res.status(500).render('error', { error: err.message || 'Something went wrong. Please try again.' });
  }
});

router.get('/dashboard', isHelperAuthenticated, async (req, res) => {
  try {
    const helper = await Helper.findById(req.session.user._id);
    if (!helper) {
      return res.redirect('/auth/login');
    }
    const isProfileComplete =
      helper.phone &&
      helper.category &&
      helper.hourlyRate &&
      helper.location?.area &&
      helper.location?.city &&
      helper.location?.pincode;
    if (!isProfileComplete) {
      return res.redirect('/helper/profile');
    }
    const bookings = await Booking.find({ helperId: req.session.user._id });
    res.render('helper/helperdashboard', {
      title: 'Helper Dashboard - UrbanMaid',
      bookings,
      user: req.session.user,
      showJoinHelper: false
    });
  } catch (err) {
    res.status(500).render('error', { error: err.message || 'Could not load dashboard.' });
  }
});

router.post('/delete-booking/:id', isHelperAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.helperId.toString() !== req.session.user._id.toString()) {
      req.flash('error_msg', 'You cannot delete this booking.');
      return res.redirect('/helper/dashboard');
    }
    await Booking.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Booking deleted successfully.');
    res.redirect('/helper/dashboard');
  } catch (err) {
    req.flash('error_msg', 'Error deleting booking. Please try again.');
    res.redirect('/helper/dashboard');
  }
});

module.exports = router;
