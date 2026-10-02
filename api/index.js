import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jawad:jawad@cluster0.acmwjwm.mongodb.net/?appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'business-nexus-secret';
const DB_NAME = 'business-nexus';

let cachedConnection = null;
let cachedUserModel = null;

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

function getUserModel() {
  if (!cachedUserModel) {
    cachedUserModel = mongoose.models.User || mongoose.model('User', userSchema);
  }
  return cachedUserModel;
}

async function seedDefaultAdmin() {
  const User = getUserModel();
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
  }
}

async function connectToDatabase() {
  if (cachedConnection && cachedConnection.readyState === 1) {
    return cachedConnection;
  }

  cachedConnection = await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  await seedDefaultAdmin();
  return cachedConnection;
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function serializeUser(user) {
  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || '',
    bio: user.bio || '',
    isOnline: user.isOnline,
    createdAt: user.createdAt?.toISOString ? user.createdAt.toISOString() : user.createdAt,
  };
}

async function getAuthenticatedUser(req, User) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = header.slice(7);
  const payload = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(payload.id).select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const requestedPath = Array.isArray(req.query?.path)
    ? req.query.path.join('/')
    : req.query?.path;
  const pathname = requestedPath ? `/api/${requestedPath}` : req.url?.split('?')[0] || '/';
  const route = pathname.replace(/^\/api\/?/, '/');

  await connectToDatabase();
  const User = getUserModel();

  if (route === '/health') {
    res.status(200).json({ status: 'ok', message: 'Business Nexus API is running' });
    return;
  }

  if (route === '/auth/register' && req.method === 'POST') {
    try {
      const body = parseBody(req);
      const { name, email, password, role } = body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ message: 'Please provide name, email, password, and role' });
        return;
      }
      if (!['entrepreneur', 'investor'].includes(role)) {
        res.status(403).json({ message: 'This role cannot be registered publicly' });
        return;
      }

      const normalizedEmail = email.toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(409).json({ message: 'Email already in use' });
        return;
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
      res.status(201).json({ user: serializeUser(user), token });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Registration failed' });
    }
    return;
  }

  if (route === '/admin/login' && req.method === 'POST') {
    try {
      const body = parseBody(req);
      const { email, password } = body;
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: 'Invalid admin credentials' });
        return;
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({ user: serializeUser(user), token });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Admin login failed' });
    }
    return;
  }

  if (route === '/auth/login' && req.method === 'POST') {
    try {
      const body = parseBody(req);
      const { email, password, role } = body;

      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      const normalizedEmail = email.toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      if (user.role === 'admin') {
        res.status(403).json({ message: 'Use the admin login endpoint' });
        return;
      }

      if (role && user.role !== role) {
        res.status(401).json({ message: 'Selected role does not match your account' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({ user: serializeUser(user), token });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Login failed' });
    }
    return;
  }

  if (route === '/auth/me' && req.method === 'GET') {
    try {
      const user = await getAuthenticatedUser(req, User);
      res.status(200).json({ user: serializeUser(user) });
    } catch (error) {
      res.status(401).json({ message: error.message || 'Authentication failed' });
    }
    return;
  }

  if (route === '/auth/profile' && req.method === 'PUT') {
    try {
      const user = await getAuthenticatedUser(req, User);
      const body = parseBody(req);
      const allowedUpdates = ['name', 'bio', 'avatarUrl', 'isOnline'];
      const updates = Object.fromEntries(
        Object.entries(body).filter(([key]) => allowedUpdates.includes(key))
      );

      const updatedUser = await User.findByIdAndUpdate(user._id, updates, { new: true }).select('-password');
      res.status(200).json({ user: serializeUser(updatedUser) });
    } catch (error) {
      res.status(401).json({ message: error.message || 'Profile update failed' });
    }
    return;
  }

  if (route === '/auth/forgot-password' && req.method === 'POST') {
    res.status(200).json({ message: 'Password reset instructions would be sent to your email.' });
    return;
  }

  if (route === '/auth/reset-password' && req.method === 'POST') {
    res.status(200).json({ message: 'Password has been reset successfully.' });
    return;
  }

  res.status(404).json({ message: 'Route not found' });
}
