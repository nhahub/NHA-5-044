import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard, { ProductImage } from '../components/ProductCard.jsx';
import { formatPrice } from '../data/catalog.js';
import { heroImage } from '../data/images.js';

export function CatalogStatus({ error, retry }) {
  return (
    <section className="container empty-state">
      {error ? (
        <>
          <p role="alert">The watch catalog could not be loaded.</p>
          <button className="button button-outline" type="button" onClick={retry}>Try again</button>
        </>
      ) : (
        <p role="status">Loading watches…</p>
      )}
    </section>
  );
}

export function HomePage({ products, categories, catalogStatus }) {
  const featured = products?.slice(0, 3);

  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">The watch collection</p>
          <h1>Built for<br className="hero-break" /> every hour.</h1>
          <p className="hero-description">Discover dress watches and everyday favourites for men and women.</p>
          <Link className="button button-primary" to="/shop">
            Explore watches <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="hero-media">
          <ProductImage src={heroImage} alt="A dress watch with a cream dial and leather strap" priority />
        </div>
      </section>

      <section className="container category-strip" aria-label="Shop by category">
        {categories.map(({ id, label }) => (
          <Link key={id} to={'/shop?category=' + id}>
            {label}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </section>

      <section className="container home-featured">
        <div className="section-heading">
          <h2>Selected watches</h2>
          <Link className="text-link" to="/shop">Shop all <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
        {catalogStatus || (featured.length ? (
          <div className="product-grid">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <p>No watches are available right now.</p>
        ))}
      </section>
    </>
  );
}

export function ShopPage({ products, categories }) {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = categories.find(({ id }) => id === params.get('category'))?.id || '';
  const [sort, setSort] = useState('featured');

  function setFilter(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  const visible = products.filter((product) =>
    (!category || category === product.category) &&
    product.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  if (sort === 'price-low') visible.sort((a, b) => a.priceCents - b.priceCents);
  if (sort === 'price-high') visible.sort((a, b) => b.priceCents - a.priceCents);

  return (
    <section className="container page-space">
      <h1>All watches</h1>
      <div className="catalog-tools">
        <label className="search-field">
          <span className="sr-only">Search watches</span>
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Search watches" value={query} onChange={(event) => setFilter('q', event.target.value)} />
        </label>
        <label className="filter-field">
          Category
          <select value={category} onChange={(event) => setFilter('category', event.target.value)}>
            <option value="">All categories</option>
            {categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label className="filter-field">
          Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price low to high</option>
            <option value="price-high">Price high to low</option>
          </select>
        </label>
      </div>
      <p className="result-count" role="status">{visible.length} {visible.length === 1 ? 'watch' : 'watches'}</p>
      {visible.length ? (
        <div className="product-grid">
          {visible.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No watches found</h2>
          <button className="button button-outline" type="button" onClick={() => setParams({}, { replace: true })}>Clear filters</button>
        </div>
      )}
    </section>
  );
}

export function ProductPage({ cart, products }) {
  const { id } = useParams();
  const product = products.find((entry) => String(entry.id) === id);
  const [addedId, setAddedId] = useState(null);
  const inCart = cart.items.find((item) => item.id === product?.id)?.qty || 0;

  if (!product) {
    return <div className="container empty-state"><h1>Watch unavailable</h1><Link className="button button-primary" to="/shop">Browse watches</Link></div>;
  }

  return (
    <div className="container page-space">
      <Link className="text-link back-link" to="/shop"><ArrowLeft size={16} aria-hidden="true" /> All watches</Link>
      <section className="detail-grid">
        <div className="detail-media">
          <ProductImage key={product.id} src={product.detailImage} alt={product.name} priority />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.categoryLabel}</p>
          <h1>{product.name}</h1>
          <p className="price detail-price">{formatPrice(product.priceCents)}</p>
          <p className="muted">{product.description}</p>
          <p>{product.stock ? 'In stock' : 'Out of stock'}</p>
          <button className="button button-primary" type="button" disabled={inCart >= product.stock} onClick={() => {
            cart.addItem(product);
            setAddedId(product.id);
          }}>Add to cart</button>
          <p className="cart-feedback" role="status">
            {addedId === product.id && inCart > 0 && <>{inCart} in your cart. <Link to="/cart">View cart</Link></>}
          </p>
        </div>
      </section>
      <section className="related-section">
        <div className="section-heading"><h2>You may also like</h2></div>
        <div className="product-grid">
          {products.filter((entry) => entry.id !== product.id).slice(0, 3).map((entry) => <ProductCard key={entry.id} product={entry} />)}
        </div>
      </section>
    </div>
  );
}
