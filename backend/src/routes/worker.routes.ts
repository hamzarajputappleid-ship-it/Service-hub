import express from 'express';
import { getWorkerProfile, updateWorkerProfile, getAllWorkers, getWorkerById } from '../controllers/worker.controller';
import { protect, worker } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getAllWorkers);
router.route('/profile')
  .get(protect, worker, getWorkerProfile)
  .put(protect, worker, updateWorkerProfile);
router.get('/:id', getWorkerById);

export default router;
