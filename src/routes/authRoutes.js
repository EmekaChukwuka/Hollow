// src/routes/authRoutes.js
import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { UserModel } from '../models/User.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    const result = await AuthService.signup(email, password, name);

    res.status(201).json({
      status: 'success',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    const result = await AuthService.login(email, password);

    res.json({
      status: 'success',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      user: UserModel.toJSON(user)
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

export const authRoutes = router;