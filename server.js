const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    touchAfter: 24 * 3600
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(flash());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

app.use('/', require('./routes/home'));
app.use('/auth', require('./routes/auth'));
app.use('/category', require('./routes/category'));
app.use('/booking', require('./routes/booking'));
app.use('/helper', require('./routes/helper'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
    url: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const isDev = req.app.get('env') === 'development';
  res.status(err.status || 500).render('error', {
    title: 'Server Error',
    error: isDev ? err : {}
  });
});

const PORT = process.env.PORT || 3000;

// Only start server after MongoDB is connected
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
