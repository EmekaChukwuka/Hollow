// src/services/authService.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError, UnauthorizedError, ValidationError } from '../middleware/errorHandler.js';
import { isValidEmail } from '../utils/validators.js';

const JWT_SECRET = env.JWT_SECRET || 'your-secret-key';
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

    // Create user
    const user = await UserModel.create({
      email,
      passwordHash,
      name: name.trim(),
      provider: 'email'
    });

    // Generate token
    const token = this.generateToken(user.id || user._id);

    return {
      user: UserModel.toJSON(user),
      token
    };
  },

  // Login a user (using the pattern from your working code)
  async login(email, password) {
    // Validate email
    if (!email || !isValidEmail(email)) {
      throw new ValidationError('Invalid email address');
    }

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password using the UserModel's comparePassword method
    const isMatch = await UserModel.comparePassword(email, password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id || user._id);

    return {
      user: UserModel.toJSON(user),
      token
    };
  },

  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { 
        id: userId.toString(),
        email: null // Will be set in the route if needed
      },
      JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY || '7d' }
    );
  },

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  },

  // Get user from token
  async getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return null;
    }

    const user = await UserModel.findById(decoded.id);
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