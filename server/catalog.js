import { randomInt } from 'node:crypto';
import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpError } from './http.js';

function readId(raw) {
  if (!/^[1-9][0-9]*$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
    throw new HttpError(404, 'Product unavailable.');
  }
  return raw;
}

function categoryId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(value);
}

function trimmed(value, maxLength) {
  return typeof value === 'string' && value.trim().length <= maxLength ? value.trim() : null;
}

function validImage(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function productInput(body) {
  const name = trimmed(body?.name, 120);
  const description = trimmed(body?.description, 2000);
  const image = trimmed(body?.image, 2000);
  const detailImage = trimmed(body?.detailImage ?? body?.image, 2000);
  const { category, priceCents, stock } = body ?? {};
  if (!name || description === null || !validImage(image) || !validImage(detailImage) ||
      !categoryId(category) || !Number.isSafeInteger(priceCents) || priceCents < 0 || priceCents > 100_000_000 ||
      !Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000) {
    throw new HttpError(400, 'Enter a product name, category, valid HTTPS image, price, and whole-number stock.');
  }
  return { name, description, image, detailImage, category, priceCents, stock };
}

function categoryLabel(body) {
  const label = trimmed(body?.label, 80);
  if (!label) throw new HttpError(400, 'Enter a category name of up to 80 characters.');
  return label;
}

function serializeProduct(snapshot, labels) {
  const { name, category, description, image, detailImage, priceCents, stock, active } = snapshot.data();
  return { id: Number(snapshot.id), name, category, categoryLabel: labels.get(category) ?? '', description, image, detailImage, priceCents, stock, active };
}

async function readCatalog(db, includeArchived) {
  const allProducts = db.collection('products');
  const query = includeArchived ? allProducts : allProducts.where('active', '==', true);
  const [productDocs, categoryDocs] = await Promise.all([query.get(), db.collection('categories').get()]);
  const categories = categoryDocs.docs.map((doc) => ({ id: doc.id, label: doc.get('label') }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const labels = new Map(categories.map(({ id, label }) => [id, label]));
  const products = productDocs.docs.map((doc) => serializeProduct(doc, labels)).sort((a, b) => a.id - b.id);
  return { products, categories };
}

export function createCatalogRouter(db) {
  const router = Router();
  router.get('/', async (req, res) => res.json(await readCatalog(db, false)));
  router.get('/products/:id', async (req, res) => {
    const doc = await db.collection('products').doc(readId(req.params.id)).get();
    if (!doc.exists || doc.get('active') !== true) throw new HttpError(404, 'Product unavailable.');
    const category = await db.collection('categories').doc(doc.get('category')).get();
    res.json(serializeProduct(doc, new Map([[category.id, category.get('label')]])));
  });
  return router;
}

export function createAdminCatalogRouter(db) {
  const router = Router();
  const products = db.collection('products');
  const categories = db.collection('categories');

  router.get('/catalog', async (req, res) => res.json(await readCatalog(db, true)));

  router.post('/products', async (req, res) => {
    const product = productInput(req.body);
    const ref = products.doc(String(randomInt(1_000_000, 2 ** 48)));
    await db.runTransaction(async (tx) => {
      if (!(await tx.get(categories.doc(product.category))).exists) throw new HttpError(400, 'Select an existing category.');
      tx.create(ref, { ...product, active: true, createdAt: FieldValue.serverTimestamp() });
    });
    res.status(201).json({ id: Number(ref.id) });
  });

  router.put('/products/:id', async (req, res) => {
    const ref = products.doc(readId(req.params.id));
    const product = productInput(req.body);
    const expectedStock = req.body?.expectedStock;
    if (!Number.isSafeInteger(expectedStock) || expectedStock < 0) throw new HttpError(400, 'Reload the product and try again.');
    await db.runTransaction(async (tx) => {
      const [current, category] = await tx.getAll(ref, categories.doc(product.category));
      if (!current.exists) throw new HttpError(404, 'Product unavailable.');
      if (!category.exists) throw new HttpError(400, 'Select an existing category.');
      if (current.get('stock') !== expectedStock) {
        throw new HttpError(409, 'Stock changed while you were editing. Reload the product and review its stock.');
      }
      tx.update(ref, { ...product, updatedAt: FieldValue.serverTimestamp() });
    });
    res.json({ id: Number(ref.id) });
  });

  router.patch('/products/:id/visibility', async (req, res) => {
    const ref = products.doc(readId(req.params.id));
    const active = req.body?.active;
    if (typeof active !== 'boolean') throw new HttpError(400, 'Choose whether to show or archive the product.');
    try {
      await ref.update({ active, updatedAt: FieldValue.serverTimestamp() });
    } catch (error) {
      if (error.code === 5) throw new HttpError(404, 'Product unavailable.');
      throw error;
    }
    res.json({ id: Number(ref.id), active });
  });

  router.post('/categories', async (req, res) => {
    const ref = await categories.add({ label: categoryLabel(req.body) });
    res.status(201).json({ id: ref.id });
  });

  router.patch('/categories/:id', async (req, res) => {
    if (!categoryId(req.params.id)) throw new HttpError(404, 'Category unavailable.');
    const ref = categories.doc(req.params.id);
    try {
      await ref.update({ label: categoryLabel(req.body) });
    } catch (error) {
      if (error.code === 5) throw new HttpError(404, 'Category unavailable.');
      throw error;
    }
    res.json({ id: ref.id });
  });

  router.delete('/categories/:id', async (req, res) => {
    if (!categoryId(req.params.id)) throw new HttpError(404, 'Category unavailable.');
    const ref = categories.doc(req.params.id);
    await db.runTransaction(async (tx) => {
      const [category, assigned] = await Promise.all([
        tx.get(ref),
        tx.get(products.where('category', '==', ref.id).limit(1)),
      ]);
      if (!category.exists) throw new HttpError(404, 'Category unavailable.');
      if (!assigned.empty) throw new HttpError(409, 'Move the products in this category before removing it.');
      tx.delete(ref);
    });
    res.json({ id: ref.id });
  });

  return router;
}
