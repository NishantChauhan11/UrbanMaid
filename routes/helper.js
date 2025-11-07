const express = require('express');
const router = express.Router();
const Helper = require('../models/Helper');
const Booking = require('../models/Booking');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
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
    console.error('Failed to load helpers:', err);
    res.status(500).render('error', { error: err.message || 'Could not load helpers.' });
  }
});

// Show profile completion form
router.get('/profile', isHelperAuthenticated, (req, res) => {
  res.render('helper/joinashelper', {
    title: 'Complete Your Profile - UrbanMaid',
    user: req.session.user
  });
});

// Handle profile completion form submission
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
    const imageURL = req.file ? '/images/' + req.file.filename : '';
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
    console.error('Error in profile completion POST:', err);
    res.status(500).render('error', { error: err.message || 'Something went wrong. Please try again.' });
  }
});

// Helper dashboard route
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
    console.error('Error loading helper dashboard:', err);
    res.status(500).render('error', { error: err.message || 'Could not load dashboard.' });
  }
});

module.exports = router;
