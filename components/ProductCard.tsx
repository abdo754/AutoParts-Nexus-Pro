import React from 'react';
import { Product, User } from '../types';

interface ProductCardProps {
  product: Product;
  currentUser: User | null;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, currentUser, onAddToCart }) => {
  const isRetailer = currentUser?.role === 'retailer';
  const canAddToCart = isRetailer && product.quantityAvailable > 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-48 object-cover object-center"
        loading="lazy"
      />
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate" title={product.name}>
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-1 line-clamp-2">
          {product.description}
        </p>
        <p className="text-xs text-gray-500 mb-1">
          Part #: <span className="font-medium">{product.partNumber}</span>
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Fits: <span className="font-medium">{product.make} {product.model} ({product.year})</span>
        </p>
        <p className="text-xs text-gray-500 mb-3">
          From: <span className="font-medium">{product.shopName}</span>
          <span className="ml-2"> | Stock: {product.quantityAvailable}</span>
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <span className="text-2xl font-bold text-blue-700">
            ${product.price.toFixed(2)}
          </span>
          {canAddToCart ? (
            <button
              onClick={() => onAddToCart && onAddToCart(product)}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
              aria-label={`Add ${product.name} to cart`}
            >
              Add to Cart
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-full cursor-not-allowed"
            >
              {product.quantityAvailable === 0 ? 'Out of Stock' : 'View Details'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;