import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'business-nexus-secret';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jawad:jawad@cluster0.acmwjwm.mongodb.net/?appName=Cluster0';

app.use(cors());
app.use(express.json());

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, required: true, enum: ['entrepreneur', 'investor', 'admin'] },
  avatarUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  isOnline: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

const seedDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@businessnexus.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'System Admin',
        email: 'admin@businessnexus.com',
        password: 'password123',
        role: 'admin',
        avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin&background=0d9488',
        bio: 'Platform administrator',
        isOnline: true,
      });
      console.log('Seeded default admin user');
    }
  } catch (error) {
    console.error('Admin seeding failed:', error.message);
  }
};

const serializeUser = (user) => ({
  id: user._id?.toString() || user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl || '',
  bio: user.bio || '',
  isOnline: user.isOnline,
  createdAt: user.createdAt?.toISOString ? user.createdAt.toISOString() : user.createdAt,
});

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Business Nexus API is running' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      bio: '',
      isOnline: true,
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: 'Selected role does not match your account' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'bio', 'avatarUrl', 'isOnline'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
    );

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Profile update failed' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  res.json({ message: 'Password reset instructions would be sent to your email.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  res.json({ message: 'Password has been reset successfully.' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

mongoose.connect(MONGODB_URI, { dbName: 'business-nexus' })
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
