// src/services/authService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError, UnauthorizedError, ValidationError } from '../middleware/errorHandler.js';
import { isValidEmail } from '../utils/validators.js';

const SALT_ROUNDS = 10;

export const AuthService = {
  // Sign up a new user
  async signup(email, password, name = '') {
    // Validate email
    if (!email || !isValidEmail(email)) {
      throw new ValidationError('Invalid email address');
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('✅ Password hash generated');

    // Create user
    const user = await UserModel.create({
      email,
      passwordHash,
      name: name.trim()
    });

    console.log('✅ User created with ID:', user._id);

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: UserModel.toJSON(user),
      token
    };
  },

  // Login a user
  async login(email, password) {
    // Validate email
    if (!email || !isValidEmail(email)) {
      throw new ValidationError('Invalid email address');
    }

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: UserModel.toJSON(user),
      token
    };
  },

  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId: userId.toString() },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY }
    );
  },

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      return decoded.userId;
    } catch (error) {
      return null;
    }
  },

  // Get user from token
  async getUserFromToken(token) {
    const userId = this.verifyToken(token);
    if (!userId) {
      return null;
    }

    const user = await UserModel.findById(userId);
    return user ? UserModel.toJSON(user) : null;
  },

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user
    await UserModel.update(userId, { passwordHash });

    return { success: true };
  },

  // Hash password (utility)
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  // Compare password (utility)
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
};