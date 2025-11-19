const express = require('express');
const router = express.Router();
const Helper = require('../models/Helper');
const User = require('../models/User');

function requireAdminAuth(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/auth/login');
}

router.get('/dashboard', requireAdminAuth, async (req, res) => {
  try {
    const users = await User.find({});
    const helpers = await Helper.find({});
    res.render('Admin/dashboard', {
      title: 'Admin Dashboard - UrbanMaid',
      user: req.session.user,
      users, helpers
    });
  } catch (err) {
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
});

router.post('/helper/:id/approve', requireAdminAuth, async (req, res) => {
  try {
    await Helper.findByIdAndUpdate(req.params.id, { isActive: true });
    res.redirect('/admin/dashboard');
  } catch {
    res.redirect('/admin/dashboard');
  }
});

router.post('/helper/:id/reject', requireAdminAuth, async (req, res) => {
  try {
    await Helper.findByIdAndUpdate(req.params.id, { isActive: false });
    res.redirect('/admin/dashboard');
  } catch {
    res.redirect('/admin/dashboard');
  }
});

router.post('/delete-user/:id', requireAdminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch {
    res.redirect('/admin/dashboard');
  }
});

router.post('/delete-helper/:id', requireAdminAuth, async (req, res) => {
  try {
    await Helper.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch {
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;
