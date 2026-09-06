// src/services/authService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;

export const AuthService = {
  async signup(email, password, name = '') {
    // Validate
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check existing
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await UserModel.create({
      email,
      passwordHash,
      name: name.trim()
    });

    // Generate token
    const token = jwt.sign(
      { userId: user._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: UserModel.toJSON(user),
      token
    };
  },

  async login(email, password) {
    // Validate
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: UserModel.toJSON(user),
      token
    };
  },

  async getMe(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return UserModel.toJSON(user);
  },

  async logout() {
    return { message: 'Logged out successfully' };
  }
};