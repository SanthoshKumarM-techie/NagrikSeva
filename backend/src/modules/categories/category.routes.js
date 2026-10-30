import { Router } from 'express';
import categoryController from './category.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';

const router = Router();

router.get('/', categoryController.listCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin-only category management
router.post('/', authenticate, authorizeRole('SUPER_ADMIN'), categoryController.createCategory);
router.put('/:id', authenticate, authorizeRole('SUPER_ADMIN'), categoryController.updateCategory);

export default router;

