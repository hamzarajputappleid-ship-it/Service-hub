import { Router } from 'express';
import { createRating, getWorkerRatings } from '../controllers/rating.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, createRating);
router.get('/worker/:workerId', getWorkerRatings);

export default router;
