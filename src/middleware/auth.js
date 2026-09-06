// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { UnauthorizedError } from './errorHandler.js';

const JWT_SECRET = env.JWT_SECRET || 'your-secret-key';

export const AuthMiddleware = {
  // Extract token from request
  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }

    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return authHeader;
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

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return null;
    }

    const user = await UserModel.findById(userId);
    return user;
  },

  // Main authentication middleware
  async authenticate(req, res, next) {
    try {
      const token = this.extractToken(req);
      if (!token) {
        throw new UnauthorizedError('Authentication required');
      }

      const user = await this.getUserFromToken(token);
      if (!user) {
        throw new UnauthorizedError('Invalid or expired token');
      }

      req.user = user;
      req.userId = user.id || user._id.toString();

      next();
    } catch (error) {
      next(error);
    }
  },

  // Optional authentication (doesn't throw if no token)
  async optionalAuth(req, res, next) {
    try {
      const token = this.extractToken(req);
      if (token) {
        const user = await this.getUserFromToken(token);
        if (user) {
          req.user = user;
          req.userId = user.id || user._id.toString();
        }
      }
      next();
    } catch (error) {
      next();
    }
  },

  // Generate JWT token (utility)
  generateToken(userId) {
    return jwt.sign(
      { id: userId.toString() },
      JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY || '7d' }
    );
  }
};

// Export individual middleware functions for cleaner route imports
export const authenticate = AuthMiddleware.authenticate;
export const optionalAuth = AuthMiddleware.optionalAuth;
export const generateToken = AuthMiddleware.generateToken;