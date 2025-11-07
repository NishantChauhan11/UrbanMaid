const express = require('express');
const router = express.Router();
const axios = require('axios');
const Helper = require('../models/Helper');

const apiBaseUrl = 'http://localhost:3000';

router.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.isAuthenticated = !!req.session?.user;
  next();
});

function respondWithJsonOrView(req, res, viewName, data) {
  if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.query.api === 'true') {
    res.json(data);
  } else {
    res.render(viewName, data);
  }
}

router.get('/', async (req, res) => {
  try {
    const [categoriesRes, helpersRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/category`),
      axios.get(`${apiBaseUrl}/helper`)
    ]);
    const data = {
      title: 'Welcome to UrbanMaid',
      categories: categoriesRes.data,
      helpers: helpersRes.data,
    };
    respondWithJsonOrView(req, res, 'home', data);
  } catch (error) {
    console.error('Failed to load home data from APIs:', error);
    res.status(500).render('error', { message: 'Failed to load home data' });
  }
});

router.get('/search', async (req, res) => {
  let query = req.query.q ? req.query.q.trim() : "";
  try {
    if (!query) {
      return res.render('helper/list', {
        title: 'Search results',
        helpers: [],
        user: req.session?.user || null,
        isAuthenticated: !!req.session?.user,
      });
    }
    let singular = query.endsWith('s') ? query.slice(0, -1) : query;
    const helpers = await Helper.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { category: { $regex: `^${query}$|^${singular}$`, $options: 'i' } }
      ]
    });

    res.render('helper/list', {
      title: `Search results for "${query}"`,
      helpers,
      user: req.session?.user || null,
      isAuthenticated: !!req.session?.user
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).render('error', { message: 'Search failed' });
  }
});

router.get('/about', (req, res) => {
  const data = { title: 'About UrbanMaid', content: 'Your trusted domestic help platform.' };
  respondWithJsonOrView(req, res, 'about', data);
});

router.get('/contact', (req, res) => {
  const data = {
    title: 'Contact Us',
    contactInfo: {
      email: 'support@urbanmaid.com',
      phone: '+1 234 567 890',
      address: '123 Urban Maid Street, City, Country'
    }
  };
  respondWithJsonOrView(req, res, 'contact', data);
});

module.exports = router;
