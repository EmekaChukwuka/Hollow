import { Router } from 'express';
import { ProjectService } from '../services/projectService.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/projects - Create project
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Project name is required');
    }

    const project = await ProjectService.create(req.userId, name, description);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects - List user's projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await ProjectService.getByUser(req.userId);

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req, res, next) => {
  try {
    const project = await ProjectService.getProjectWithStats(req.params.id);

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, requireApiKey, corsConfig } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (requireApiKey !== undefined) updates.requireApiKey = requireApiKey;
    if (corsConfig !== undefined) updates.corsConfig = corsConfig;

    const project = await ProjectService.update(
      req.params.id,
      req.userId,
      updates
    );

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    await ProjectService.delete(req.params.id, req.userId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/regenerate-key - Regenerate API key
router.post('/:id/regenerate-key', async (req, res, next) => {
  try {
    const apiKey = await ProjectService.regenerateApiKey(req.params.id, req.userId);

    res.json({
      success: true,
      data: { apiKey }
    });
  } catch (error) {
    next(error);
  }
});

export const projectRoutes = router;