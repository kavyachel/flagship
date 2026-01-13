import { Router } from 'express';
import {
  trackEvent,
  trackEventsBatch,
  getEventsByUser,
  getEventsByExperiment,
  getExperimentMetrics,
  getEventSummary,
} from '../controllers/eventController.js';

const router = Router();

/**
 * Event Routes
 *
 * POST /api/v1/events                        - Track single event
 * POST /api/v1/events/batch                  - Track multiple events
 * GET  /api/v1/events/user/:userId           - Get events by user
 * GET  /api/v1/events/experiment/:experimentId - Get events by experiment
 * GET  /api/v1/events/metrics/:experimentId  - Get experiment analytics
 * GET  /api/v1/events/summary                - Get event summary
 */

router.post('/', trackEvent);
router.post('/batch', trackEventsBatch);
router.get('/user/:userId', getEventsByUser);
router.get('/experiment/:experimentId', getEventsByExperiment);
router.get('/metrics/:experimentId', getExperimentMetrics);
router.get('/summary', getEventSummary);

export default router;
