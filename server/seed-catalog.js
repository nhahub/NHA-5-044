import { FieldValue } from 'firebase-admin/firestore';
import { categories, fetchWatches } from '../src/data/watchApi.js';
import { db } from './firebase.js';

const marker = db.collection('appMetadata').doc('dummyjson-catalog-v1');
if ((await marker.get()).exists) {
  console.log('The catalog has already been imported.');
} else {
  const watches = await fetchWatches(AbortSignal.timeout(15_000));
  if (!watches.length) throw new Error('The source returned no watches.');

  const categoryRefs = categories.map(({ id }) => db.collection('categories').doc(id));
  const productRefs = watches.map(({ id }) => db.collection('products').doc(String(id)));

  const result = await db.runTransaction(async (tx) => {
    if ((await tx.get(marker)).exists) return null;
    const [categoryDocs, productDocs] = await Promise.all([
      tx.getAll(...categoryRefs), tx.getAll(...productRefs),
    ]);
    let newCategories = 0;
    let newProducts = 0;

    categoryDocs.forEach((snapshot, index) => {
      if (snapshot.exists) return;
      tx.create(snapshot.ref, { label: categories[index].label });
      newCategories++;
    });
    productDocs.forEach((snapshot, index) => {
      if (snapshot.exists) return;
      const { id, categoryLabel, ...watch } = watches[index];
      tx.create(snapshot.ref, {
        ...watch, description: watch.description ?? '', detailImage: watch.detailImage ?? watch.image,
        active: true, createdAt: FieldValue.serverTimestamp(),
      });
      newProducts++;
    });
    tx.create(marker, { importedAt: FieldValue.serverTimestamp() });
    return { newCategories, newProducts };
  });

  console.log(result
    ? `Imported ${result.newProducts} watches and ${result.newCategories} categories.`
    : 'The catalog has already been imported.');
}
