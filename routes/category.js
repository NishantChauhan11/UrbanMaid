const express = require('express');
const router = express.Router();
const Helper = require('../models/Helper');

router.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
  next();
});

const categories = {
  maid:        { name: 'Maid Services',      icon: '', description: 'Professional house cleaning and maintenance services' },
  cook:        { name: 'Cook Services',      icon: '', description: 'Expert cooking and meal preparation for your family' },
  babysitter:  { name: 'Babysitting',        icon: '', description: 'Trusted childcare services for your little ones' },
  cleaner:     { name: 'Deep Cleaning',      icon: '', description: 'Intensive and professional cleaning services for your home' },
  plumber:     { name: 'Plumbing',            icon: '', description: 'Expert plumbing and leak repair services' },
  electrician: { name: 'Electrician',         icon: '', description: 'Certified professionals for electrical work and repairs' },
  gardener:    { name: 'Gardening',           icon: '', description: 'Professional gardening and landscaping services' },
  driver:      { name: 'Driver Services',     icon: '', description: 'Skilled drivers for daily commutes and travel' }
};

router.get('/', (req, res) => {
  const categoriesArray = Object.entries(categories).map(([slug, data]) => ({
    slug,
    name: data.name,
    icon: data.icon,
    description: data.description
  }));

  res.render('category/all', {
    title: 'All Categories - UrbanMaid',
    categories: categoriesArray
  });
});

router.get('/:categoryName', async (req, res, next) => {
  const { categoryName } = req.params;

  if (!categories[categoryName]) {
    return res.status(404).render('404', { message: 'Category not found' });
  }

  try {
    const helpers = await Helper.find({ category: categoryName });

    res.render('category/list', {
      title: `${categories[categoryName].name} - UrbanMaid`,
      helpers,
      category: categories[categoryName],
      categoryName
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:categoryName/helper/:helperId', async (req, res, next) => {
  const { categoryName, helperId } = req.params;

  if (!categories[categoryName]) {
    return res.status(404).render('404', { message: 'Category not found' });
  }

  try {
    const helper = await Helper.findById(helperId);

    if (!helper) {
      return res.status(404).render('404', { message: 'Helper not found' });
    }

    res.render('category/single', {
      title: `${helper.name} - ${categories[categoryName].name} - UrbanMaid`,
      helper,
      category: categories[categoryName],
      categoryName
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:categoryName/helper/:helperId', async (req, res) => {
  try {
    const updatedHelper = await Helper.findByIdAndUpdate(
      req.params.helperId,
      req.body,
      { new: true, runValidators: true, overwrite: true }
    );
    if (!updatedHelper) {
      return res.status(404).json({ error: 'Helper not found' });
    }
    res.json(updatedHelper);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update helper' });
  }
});

router.patch('/:categoryName/helper/:helperId', async (req, res) => {
  try {
    const updatedHelper = await Helper.findByIdAndUpdate(
      req.params.helperId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedHelper) {
      return res.status(404).json({ error: 'Helper not found' });
    }
    res.json(updatedHelper);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update helper' });
  }
});

router.delete('/:categoryName/helper/:helperId', async (req, res) => {
  try {
    const deletedHelper = await Helper.findByIdAndDelete(req.params.helperId);
    if (!deletedHelper) {
      return res.status(404).json({ error: 'Helper not found' });
    }
    res.json({ success: true, message: 'Helper deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete helper' });
  }
});

module.exports = router;
