import { Router } from 'express';
import {
  evaluateFlag,
  evaluateBatch,
  evaluateAll,
} from '../controllers/evaluationController.js';

const router = Router();

/**
 * Evaluation Routes (HOT PATH)
 *
 * GET  /api/v1/evaluate         - Evaluate a single flag
 * POST /api/v1/evaluate/batch   - Evaluate multiple flags
 * GET  /api/v1/evaluate/all     - Evaluate all flags for a user
 */

router.get('/', evaluateFlag);
router.post('/batch', evaluateBatch);
router.get('/all', evaluateAll);

export default router;
