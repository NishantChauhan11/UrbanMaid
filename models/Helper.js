const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const helperSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  // Make all profile fields optional and default to undefined
  phone: { type: String, trim: true, default: undefined },
  category: { 
    type: String,
    enum: ['maid', 'cook', 'babysitter', 'cleaner', 'plumber', 'electrician', 'gardener', 'driver'],
    required: false,
    default: undefined // <--- DO NOT use ""
  },
  experience: { type: Number, default: 0, min: 0 },
  hourlyRate: { type: Number, min: 0, default: undefined },
  location: {
    area: { type: String, trim: true, default: undefined },
    city: { type: String, trim: true, default: undefined },
    pincode: { type: String, trim: true, default: undefined }
  },
  description: { type: String, trim: true, maxlength: 500, default: undefined },
  imageURL: { type: String, default: undefined },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  isVerified: { type: Boolean, default: false },
  availability: { type: String, enum: ['available', 'busy'], default: 'available' },
  role: { type: String, default: 'helper' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

helperSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

helperSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if profile is fully filled for bookings/dashboard
helperSchema.virtual('isProfileComplete').get(function() {
  return (
    this.phone &&
    this.category &&
    this.hourlyRate &&
    this.location &&
    this.location.area &&
    this.location.city &&
    this.location.pincode
  );
});

module.exports = mongoose.model('Helper', helperSchema);
