import React from 'react';
import { Product, User } from '../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  currentUser: User | null;
  onAddToCart?: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, currentUser, onAddToCart }) => {
  if (products.length === 0) {
    return (
      <div className="container mx-auto mt-8 p-4 text-center text-gray-600 text-xl">
        No products found matching your search.
      </div>
    );
  }

  return (
    <div className="container mx-auto my-8 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currentUser={currentUser}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;