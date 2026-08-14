// backend/src/modules/customers/routes/customer.routes.ts
import { Router } from 'express';

import { requireAuth, resolveWorkspace } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';

import { customerController } from '../controller/customer.controller';

const router: Router = Router();

router.use(requireAuth, resolveWorkspace);

router.post('/', asyncHandler(customerController.createCustomer));
router.get('/', asyncHandler(customerController.listCustomers));
router.get('/:id', asyncHandler(customerController.getCustomer));
router.patch('/:id', asyncHandler(customerController.updateCustomer));
router.delete('/:id', asyncHandler(customerController.deleteCustomer));

export { router as customerRoutes };
