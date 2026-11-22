import { createHash } from 'node:crypto';
import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpError } from './http.js';
import { nextOrderStatus } from '../src/data/orderStatus.js';

const requestIdPattern = /^[a-f0-9]{32}$/;
const orderIdPattern = /^[a-f0-9]{64}$/;

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function readCheckout(body) {
  const name = typeof body?.delivery?.recipientName === 'string' ? body.delivery.recipientName.trim() : '';
  const phone = typeof body?.delivery?.phone === 'string' ? body.delivery.phone.trim() : '';
  const address = typeof body?.delivery?.address === 'string' ? body.delivery.address.trim() : '';
  const phoneDigits = phone.replace(/\D/g, '');
  if (!name || name.length > 120 || !address || address.length > 500 ||
      phone.length > 40 || !/^\+?[0-9 ()-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return null;
  }

  if (typeof body.requestId !== 'string' || !requestIdPattern.test(body.requestId) ||
      !Array.isArray(body.items) || !body.items.length || body.items.length > 50) return null;

  const seen = new Set();
  const items = [];
  for (const entry of body.items) {
    if (!Number.isSafeInteger(entry?.productId) || entry.productId < 1 ||
        !Number.isSafeInteger(entry.quantity) || entry.quantity < 1 || seen.has(entry.productId)) return null;
    seen.add(entry.productId);
    items.push({ productId: entry.productId, quantity: entry.quantity });
  }

  return {
    requestId: body.requestId,
    delivery: { recipientName: name, phone, address },
    items: items.sort((a, b) => a.productId - b.productId),
  };
}

function orderSummary(snapshot) {
  const order = snapshot.data();
  return {
    id: snapshot.id,
    orderRef: order.orderRef,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    totalCents: order.totalCents,
    createdAt: order.createdAt.toDate().toISOString(),
  };
}

function sendExistingOrder(res, snapshot, requestHash) {
  const { orderRef, checkoutHash } = snapshot.data();
  if (checkoutHash !== requestHash) {
    return res.status(409).json({
      message: 'An order was already saved for this checkout with different details.',
      existingOrderId: snapshot.id,
    });
  }
  return res.json({ id: snapshot.id, orderRef });
}

function orderDetails(snapshot) {
  const { delivery, items } = snapshot.data();
  return { ...orderSummary(snapshot), delivery, items };
}

export function createOrdersRouter(db) {
  const router = Router();
  const orders = db.collection('orders');
  const products = db.collection('products');

  router.post('/', async (req, res) => {
    const checkout = readCheckout(req.body);
    if (!checkout) return res.status(400).json({ message: 'Check the delivery details and quantities in your cart.' });

    const { items, delivery, requestId } = checkout;
    const orderId = sha256([req.identity.uid, requestId]);
    const requestHash = sha256({ items, delivery });
    const ref = orders.doc(orderId);
    const orderRef = 'WH-' + orderId.slice(0, 16).toUpperCase();
    const expected = req.body.expectedTotalCents;
    if (expected !== undefined && (!Number.isSafeInteger(expected) || expected < 0)) {
      throw new HttpError(400, 'Invalid checkout total.');
    }

    const existing = await db.runTransaction(async (tx) => {
      const order = await tx.get(ref);
      if (order.exists) return order;

      const watches = await tx.getAll(...items.map(({ productId }) => products.doc(String(productId))));
      const orderItems = items.map(({ productId, quantity }, index) => {
        const watch = watches[index].data();
        if (watch?.active !== true || !Number.isSafeInteger(watch.stock) || quantity > watch.stock) {
          throw new HttpError(422, 'A watch in your cart is unavailable in the selected quantity. Review your cart.', { catalogChanged: true });
        }
        const lineTotalCents = watch.priceCents * quantity;
        if (!Number.isSafeInteger(lineTotalCents) || lineTotalCents < 0) throw new Error('Invalid catalog price');
        return { productId, productName: watch.name, unitPriceCents: watch.priceCents, quantity, lineTotalCents };
      });

      const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
      if (!Number.isSafeInteger(subtotalCents)) throw new Error('Invalid order total');
      if (expected !== undefined && expected !== subtotalCents) {
        throw new HttpError(409, 'Prices changed. Review the updated total before placing your order.', { catalogChanged: true });
      }

      tx.create(ref, {
        orderRef, userId: req.identity.uid, delivery, items: orderItems,
        currency: 'USD', subtotalCents, discountCents: 0, totalCents: subtotalCents,
        paymentMethod: 'cod', paymentStatus: 'unpaid', status: 'pending',
        createdAt: FieldValue.serverTimestamp(), checkoutHash: requestHash,
      });
      watches.forEach((watch, index) => tx.update(watch.ref, {
        stock: watch.get('stock') - items[index].quantity,
      }));
      return null;
    });

    if (existing) return sendExistingOrder(res, existing, requestHash);
    res.status(201).json({ id: orderId, orderRef });
  });

  router.get('/', async (req, res) => {
    const snapshot = await orders.where('userId', '==', req.identity.uid).get();
    const summaries = snapshot.docs.map(orderSummary);
    summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(summaries);
  });

  router.get('/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const unavailable = { message: 'This order is unavailable.' };
    if (!orderIdPattern.test(orderId)) return res.status(404).json(unavailable);

    const snapshot = await orders.doc(orderId).get();
    const order = snapshot.data();
    if (order?.userId !== req.identity.uid) return res.status(404).json(unavailable);

    res.json(orderDetails(snapshot));
  });

  return router;
}

export function createAdminOrdersRouter(db) {
  const router = Router();
  const orders = db.collection('orders');
  const unavailable = () => new HttpError(404, 'This order is unavailable.');

  router.get('/', async (req, res) => {
    const pageSize = 25;
    let query = orders.orderBy('createdAt', 'desc');
    if (req.query.after !== undefined) {
      if (typeof req.query.after !== 'string' || !orderIdPattern.test(req.query.after)) {
        throw new HttpError(400, 'Invalid order page.');
      }
      const cursor = await orders.doc(req.query.after).get();
      if (!cursor.exists) throw new HttpError(404, 'This order page is unavailable.');
      query = query.startAfter(cursor);
    }
    const [recent, count] = await Promise.all([query.limit(pageSize + 1).get(), orders.count().get()]);
    const page = recent.docs.slice(0, pageSize);
    res.json({
      orders: page.map(orderSummary),
      count: count.data().count,
      next: recent.size > pageSize ? page.at(-1).id : null,
    });
  });

  router.get('/:orderId', async (req, res) => {
    if (!orderIdPattern.test(req.params.orderId)) throw unavailable();
    const order = await orders.doc(req.params.orderId).get();
    if (!order.exists) throw unavailable();
    res.json(orderDetails(order));
  });

  router.patch('/:orderId/status', async (req, res) => {
    if (!orderIdPattern.test(req.params.orderId)) throw unavailable();
    const { status, fromStatus } = req.body ?? {};
    if (typeof status !== 'string' || !Object.hasOwn(nextOrderStatus, fromStatus) || nextOrderStatus[fromStatus] !== status) {
      throw new HttpError(400, 'Choose the next valid order status.');
    }

    const ref = orders.doc(req.params.orderId);
    await db.runTransaction(async (tx) => {
      const order = await tx.get(ref);
      if (!order.exists) throw unavailable();
      if (order.get('status') === status) return;
      if (order.get('status') !== fromStatus) {
        throw new HttpError(409, 'The order status changed. Reload the order and try again.');
      }
      tx.update(ref, {
        status, statusUpdatedAt: FieldValue.serverTimestamp(), statusUpdatedBy: req.identity.uid,
      });
    });
    res.json(orderDetails(await ref.get()));
  });

  return router;
}
