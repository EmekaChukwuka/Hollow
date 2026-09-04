import { Router } from 'express';
import { DataService } from '../services/dataService.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// GET /api/projects/:projectId/endpoints/:endpointId/data - List all data
router.get('/', async (req, res, next) => {
  try {
    const { projectId, endpointId } = req.params;
    const query = req.query;

    const result = await DataService.findAll(
      projectId,
      endpointId,
      req.userId,
      query
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/endpoints/:endpointId/data/:itemId - Get single item
router.get('/:itemId', async (req, res, next) => {
  try {
    const { projectId, endpointId, itemId } = req.params;

    const doc = await DataService.findOne(
      projectId,
      endpointId,
      req.userId,
      itemId
    );

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/endpoints/:endpointId/data - Create data
router.post('/', async (req, res, next) => {
  try {
    const { projectId, endpointId } = req.params;
    const data = req.body;

    if (!data || typeof data !== 'object') {
      throw new ValidationError('Data is required');
    }

    const doc = await DataService.create(
      projectId,
      endpointId,
      req.userId,
      data
    );

    res.status(201).json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:projectId/endpoints/:endpointId/data/:itemId - Update data
router.put('/:itemId', async (req, res, next) => {
  try {
    const { projectId, endpointId, itemId } = req.params;
    const data = req.body;

    if (!data || typeof data !== 'object') {
      throw new ValidationError('Data is required');
    }

    const doc = await DataService.update(
      projectId,
      endpointId,
      req.userId,
      itemId,
      data
    );

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:projectId/endpoints/:endpointId/data/:itemId - Partial update
router.patch('/:itemId', async (req, res, next) => {
  try {
    const { projectId, endpointId, itemId } = req.params;
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('Updates are required');
    }

    // Get existing document first
    const existing = await DataService.findOne(
      projectId,
      endpointId,
      req.userId,
      itemId
    );

    // Merge updates with existing data
    const mergedData = {
      ...existing.data,
      ...updates
    };

    const doc = await DataService.update(
      projectId,
      endpointId,
      req.userId,
      itemId,
      mergedData
    );

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:projectId/endpoints/:endpointId/data/:itemId - Delete data
router.delete('/:itemId', async (req, res, next) => {
  try {
    const { projectId, endpointId, itemId } = req.params;

    await DataService.delete(
      projectId,
      endpointId,
      req.userId,
      itemId
    );

    res.json({
      success: true,
      message: 'Data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:projectId/endpoints/:endpointId/data/clear - Clear all data
router.delete('/clear', async (req, res, next) => {
  try {
    const { projectId, endpointId } = req.params;

    const result = await DataService.clear(
      projectId,
      endpointId,
      req.userId
    );

    res.json({
      success: true,
      data: result,
      message: 'All data cleared'
    });
  } catch (error) {
    next(error);
  }
});

export const dataRoutes = router;