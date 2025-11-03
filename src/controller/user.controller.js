const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Utils (set your env secret or use a default for development)
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret';
const JWT_EXPIRES_IN = '12h';

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Register
exports.register = async (req, res) => {
  try {
    const { email, password, ...profile } = req.body;

    // Check if already exists
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      ...profile,
    });

    res.status(201).json({ message: 'User registered', id: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout (handled client-side by deleting token. Optionally support server-side blacklisting)
exports.logout = async (req, res) => {
  // Assumes stateless JWT auth: client deletes token.
  res.json({ message: 'Logged out successfully' });
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // req.user populated by authentication middleware
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // req.user should be set by auth middleware
    const profileFields = [
      'firstName',
      'lastName',
      'phone',
      'avatar',
      'bio',
      'dateOfBirth'
    ];
    const updates = {};
    for (const field of profileFields) {
      if (field in req.body) updates[field] = req.body[field];
    }
    const [n, [user]] = await User.update(updates, {
      where: { id: userId },
      returning: true // returns the updated record
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    let preferences = {};
    if (user.preferences) {
      try {
        preferences = JSON.parse(user.preferences);
      } catch (_) {
        preferences = {};
      }
    }
    preferences = { ...preferences, ...req.body };

    user.preferences = JSON.stringify(preferences);
    await user.save();

    res.json({ message: 'Preferences updated', preferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Preferences
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    let preferences = {};
    if (user.preferences) {
      try {
        preferences = JSON.parse(user.preferences);
      } catch (_) {
        preferences = {};
      }
    }

    res.json({ preferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manage Plan fields: subscribe, cancel, get plan (optional, mock; expand as needed)
exports.getPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Mock plan info; adjust as your model supports
    res.json({ plan: user.plan || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    user.plan = req.body.plan;
    await user.save();

    res.json({ message: 'Plan updated', plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
