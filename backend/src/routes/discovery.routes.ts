import express from 'express';
import { getCategories, getWorkerDetails } from '../controllers/discovery.controller';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/worker/:id', getWorkerDetails);

export default router;
