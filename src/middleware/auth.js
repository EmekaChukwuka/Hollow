import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { UnauthorizedError } from './errorHandler.js';

export const AuthMiddleware = {
  // Extract token from request
  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }

    // Check if it's a Bearer token
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // If no Bearer prefix, assume the whole header is the token
    return authHeader;
  },

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
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

    const user = await UserModel.findById(decoded.userId);
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

      // Attach user to request
      req.user = user;
      req.userId = user._id.toString();

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
          req.userId = user._id.toString();
        }
      }
      next();
    } catch (error) {
      // Don't fail on optional auth, just proceed without user
      next();
    }
  },

  // Check if user owns a project (for route-level authorization)
  async requireProjectOwnership(req, res, next) {
    try {
      const { projectId } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { ProjectModel } = await import('../models/Project.js');
      const hasAccess = await ProjectModel.belongsToUser(projectId, userId);

      if (!hasAccess) {
        throw new UnauthorizedError('You do not have access to this project');
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Check if user owns an endpoint (for route-level authorization)
  async requireEndpointOwnership(req, res, next) {
    try {
      const { projectId, endpointId } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { EndpointModel } = await import('../models/Endpoint.js');
      const hasAccess = await EndpointModel.belongsToProject(endpointId, projectId);

      if (!hasAccess) {
        throw new UnauthorizedError('You do not have access to this endpoint');
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Generate JWT token (utility)
  generateToken(userId) {
    return jwt.sign(
      { userId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY }
    );
  }
};

// Export individual middleware functions for cleaner route imports
export const authenticate = AuthMiddleware.authenticate;
export const optionalAuth = AuthMiddleware.optionalAuth;
export const requireProjectOwnership = AuthMiddleware.requireProjectOwnership;
export const requireEndpointOwnership = AuthMiddleware.requireEndpointOwnership;
export const generateToken = AuthMiddleware.generateToken;