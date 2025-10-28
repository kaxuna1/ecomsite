import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { orderService } from '../services/orderService';
import { authenticate, optionalAuth } from '../middleware/authMiddleware';
import { sendOrderConfirmation } from '../utils/notifications';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    // If userId is present in token, user is a regular user - return only their orders
    // Otherwise, it's an admin - return all orders
    const orders = req.userId
      ? await orderService.listByUserId(req.userId)
      : await orderService.list();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

router.post(
  '/',
  optionalAuth,
  [
    body('customer.name').isString().notEmpty(),
    body('customer.email').isEmail(),
    body('customer.address').isString().notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isInt({ min: 1 }),
    body('items.*.quantity').isInt({ min: 1 }),
    body('total').isFloat({ min: 0 })
  ],
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // userId will be set by optionalAuth middleware if user is logged in
      const order = await orderService.create(req.body, req.userId);
      await sendOrderConfirmation(
        {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone
        },
        order.id
      );
      res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: 'Unable to create order' });
    }
  }
);

router.patch('/:id', authenticate, [body('status').isString().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const order = await orderService.updateStatus(Number(req.params.id), req.body.status);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

export default router;
