const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Helper = require('../models/Helper');
const Admin = require('../models/Admin');

router.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.isAuthenticated = !!req.session?.user;
  next();
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register - UrbanMaid' });
});

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    req.flash('error_msg', 'Please fill all required fields.');
    return res.redirect('/auth/register');
  }
  if (role === 'helper') {
    const existingHelper = await Helper.findOne({ email });
    if (existingHelper) {
      req.flash('error_msg', 'Helper already exists with this email.');
      return res.redirect('/auth/register');
    }
    // Do NOT set category, phone, hourlyRate, location at registration
    const newHelper = new Helper({ name, email, password, role });
    await newHelper.save();
    req.session.user = {
      _id: newHelper._id,
      name: newHelper.name,
      email: newHelper.email,
      role: 'helper'
    };
    return res.redirect('/helper/dashboard');
  } else if (role === 'admin') {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      req.flash('error_msg', 'Admin already exists with this email.');
      return res.redirect('/auth/register');
    }
    const newAdmin = new Admin({ name, email, password });
    await newAdmin.save();
    req.session.user = {
      _id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: 'admin'
    };
    return res.redirect('/admin/dashboard');
  } else {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error_msg', 'User already exists with this email.');
      return res.redirect('/auth/register');
    }
    const newUser = new User({ name, email, password });
    await newUser.save();
    req.session.user = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: 'user'
    };
    return res.redirect('/');
  }
});

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login - UrbanMaid' });
});

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  let user;
  if (role === 'helper') {
    user = await Helper.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error_msg', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: 'helper'
    };
    return res.redirect('/helper/dashboard');
  } else if (role === 'admin') {
    user = await Admin.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error_msg', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: 'admin'
    };
    return res.redirect('/admin/dashboard');
  } else {
    user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error_msg', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: 'user'
    };
    return res.redirect('/');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
