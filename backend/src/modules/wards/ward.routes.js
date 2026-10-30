import { Router } from 'express';
import wardController from './ward.controller.js';

const router = Router();

router.get('/', wardController.listWards);
router.get('/:id', wardController.getWardById);

export default router;

