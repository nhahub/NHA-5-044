import express from 'express';
import { auth, db } from './firebase.js';
import { createOrdersRouter, createAdminOrdersRouter } from './orders.js';
import { createCatalogRouter, createAdminCatalogRouter } from './catalog.js';
import { HttpError, requireIdentity } from './http.js';

const app = express();
app.disable('x-powered-by');
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/api/catalog', createCatalogRouter(db));
app.use('/api/orders', requireIdentity(auth), express.json({ limit: '16kb' }), createOrdersRouter(db));
app.use('/api/admin', requireIdentity(auth, { admin: true }), express.json({ limit: '16kb' }));
app.use('/api/admin/orders', createAdminOrdersRouter(db));
app.use('/api/admin', createAdminCatalogRouter(db));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) return res.status(error.status).json({ message: error.message, ...error.details });
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res.status(error.status).json({ message: 'Invalid request data.' });
  }
  console.error('API request failed:', error.code ?? error.name);
  res.status(503).json({ message: 'The store service is unavailable. Please try again.' });
});

const port = Number(process.env.ORDERS_PORT || 3001);
app.listen(port, '127.0.0.1', () => {
  console.log(`Watch Heaven API listening on http://127.0.0.1:${port}`);
});
