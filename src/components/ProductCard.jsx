import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, productPath } from '../data/catalog.js';

export function ProductImage({ src, alt, className, priority = false }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return <div className={'image-unavailable ' + (className || '')} role="img" aria-label={alt + ' image unavailable'}>Image unavailable</div>;
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      onError={() => setFailed(true)}
    />
  );
}

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={productPath(product)}>
        <div className="product-media">
          <ProductImage src={product.image} alt="" />
        </div>
        <div className="product-card-heading">
          <h3>{product.name}</h3>
          <ArrowUpRight size={17} aria-hidden="true" />
        </div>
        <p className="price">{formatPrice(product.priceCents)}</p>
      </Link>
    </article>
  );
}
