import { Router } from 'express';
import { EndpointService } from '../services/endpointService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// POST /api/projects/:projectId/endpoints - Create endpoint
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const endpointData = req.body;

    const endpoint = await EndpointService.create(
      projectId,
      req.userId,
      endpointData
    );

    res.status(201).json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/endpoints - List endpoints
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const endpoints = await EndpointService.getByProject(projectId, req.userId);

    res.json({
      success: true,
      data: endpoints
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/endpoints/:endpointId - Get endpoint
router.get('/:endpointId', async (req, res, next) => {
  try {
    const { projectId, endpointId } = req.params;
    const endpoint = await EndpointService.getById(endpointId, projectId);

    res.json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:projectId/endpoints/:endpointId - Update endpoint
router.put('/:endpointId', async (req, res, next) => {
  try {
    const { projectId, endpointId } = req.params;
    const updates = req.body;

    const endpoint = await EndpointService.update(
      endpointId,
      projectId,
      req.userId,
      updates
    );

    res.json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:projectId/endpoints/:endpointId - Delete endpoint
router.delete('/:endpointId', async (req, res, next) => {
  try {
    const { projectId, endpointId } = req.params;

    await EndpointService.delete(endpointId, projectId, req.userId);

    res.json({
      success: true,
      message: 'Endpoint deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export const endpointRoutes = router;