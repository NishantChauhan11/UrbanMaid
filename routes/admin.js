const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Helper = require('../models/Helper');
const User = require('../models/User');
const Booking = require('../models/Booking');

function requireAdminAuth(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error_msg', 'Admin login required');
  res.redirect('/auth/login');
}

// Admin dashboard: display users and helpers
router.get('/dashboard', requireAdminAuth, async (req, res) => {
  try {
    const users = await User.find({});
    const helpers = await Helper.find({});
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - UrbanMaid',
      user: req.session.user,
      users,
      helpers
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
});

// Approve helper
router.post('/helper/:id/approve', requireAdminAuth, async (req, res) => {
  try {
    await Helper.findByIdAndUpdate(req.params.id, { isActive: true });
    req.flash('success_msg', 'Helper approved successfully');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error approving helper:', error);
    req.flash('error_msg', 'Failed to approve helper');
    res.redirect('/admin/dashboard');
  }
});

// Reject helper
router.post('/helper/:id/reject', requireAdminAuth, async (req, res) => {
  try {
    await Helper.findByIdAndUpdate(req.params.id, { isActive: false });
    req.flash('success_msg', 'Helper rejected successfully');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error rejecting helper:', error);
    req.flash('error_msg', 'Failed to reject helper');
    res.redirect('/admin/dashboard');
  }
});

// Delete user
router.post('/delete-user/:userId', requireAdminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    req.flash('success_msg', 'User deleted successfully');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting user:', error);
    req.flash('error_msg', 'Failed to delete user');
    res.redirect('/admin/dashboard');
  }
});

// Delete helper
router.post('/delete-helper/:helperId', requireAdminAuth, async (req, res) => {
  try {
    await Helper.findByIdAndDelete(req.params.helperId);
    req.flash('success_msg', 'Helper deleted successfully');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting helper:', error);
    req.flash('error_msg', 'Failed to delete helper');
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;
