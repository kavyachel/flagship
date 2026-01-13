import { Router } from 'express';
import {
  createExperiment,
  getAllExperiments,
  getExperimentById,
  updateExperiment,
  startExperiment,
  stopExperiment,
  deleteExperiment,
  updateVariantWeights,
} from '../controllers/experimentController.js';

const router = Router();

/**
 * Experiment Routes
 *
 * POST   /api/v1/experiments              - Create experiment with variants
 * GET    /api/v1/experiments              - List all experiments (optional: ?flagId=)
 * GET    /api/v1/experiments/:id          - Get experiment by ID
 * PUT    /api/v1/experiments/:id          - Update experiment
 * DELETE /api/v1/experiments/:id          - Delete experiment
 * POST   /api/v1/experiments/:id/start    - Start experiment
 * POST   /api/v1/experiments/:id/stop     - Stop experiment
 * PUT    /api/v1/experiments/:id/variants - Update variant weights
 */

router.post('/', createExperiment);
router.get('/', getAllExperiments);
router.get('/:id', getExperimentById);
router.put('/:id', updateExperiment);
router.delete('/:id', deleteExperiment);
router.post('/:id/start', startExperiment);
router.post('/:id/stop', stopExperiment);
router.put('/:id/variants', updateVariantWeights);

export default router;
