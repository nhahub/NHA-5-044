export const categories = [
  { id: 'mens-watches', label: "Men's watches" },
  { id: 'womens-watches', label: "Women's watches" },
];

export async function fetchWatches(signal) {
  const lists = await Promise.all(
    categories.map(async ({ id, label }) => {
      const response = await fetch(
        'https://dummyjson.com/products/category/' + id + '?limit=0',
        { signal },
      );

      if (!response.ok) {
        throw new Error('Could not load the watch catalog (' + response.status + ').');
      }

      const data = await response.json();
      if (!Array.isArray(data.products)) {
        throw new Error('The watch catalog returned an unexpected response.');
      }

      return data.products.map((watch) => ({
        id: watch.id,
        name: watch.title,
        category: id,
        categoryLabel: label,
        priceCents: Math.round(watch.price * 100),
        stock: watch.stock,
        image: watch.thumbnail || watch.images?.[0],
        detailImage: watch.images?.[0] || watch.thumbnail,
        description: watch.description,
      }));
    }),
  );

  return lists.flat();
}
