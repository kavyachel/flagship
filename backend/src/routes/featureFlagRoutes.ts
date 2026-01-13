import { Router } from 'express';
import {
  createFlag,
  getAllFlags,
  getFlagById,
  updateFlag,
  deleteFlag,
  toggleFlag,
} from '../controllers/featureFlagController.js';

const router = Router();

/**
 * Feature Flag Routes
 *
 * POST   /api/v1/flags           - Create a new flag
 * GET    /api/v1/flags           - Get all flags (optional: ?environment=prod)
 * GET    /api/v1/flags/:id       - Get a flag by ID
 * PUT    /api/v1/flags/:id       - Update a flag
 * DELETE /api/v1/flags/:id       - Delete a flag
 * POST   /api/v1/flags/:id/toggle - Toggle a flag's enabled state
 */

router.post('/', createFlag);
router.get('/', getAllFlags);
router.get('/:id', getFlagById);
router.put('/:id', updateFlag);
router.delete('/:id', deleteFlag);
router.post('/:id/toggle', toggleFlag);

export default router;
