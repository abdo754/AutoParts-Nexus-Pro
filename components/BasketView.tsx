import React from 'react';
import { CartItem } from '../types';

interface BasketViewProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

const BasketView: React.FC<BasketViewProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onContinueShopping,
}) => {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-blue-700 mb-6 border-b pb-4">Your Shopping Basket</h2>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">Your basket is empty!</p>
          <button
            onClick={onContinueShopping}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-300"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex items-center border-b border-gray-200 pb-4 last:border-b-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-md mr-4 shadow-sm"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">From: {item.shopName}</p>
                  <p className="text-md text-blue-700 font-bold">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor={`quantity-${item.productId}`} className="sr-only">Quantity for {item.name}</label>
                  <input
                    id={`quantity-${item.productId}`}
                    type="number"
                    min="1"
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.productId, parseInt(e.target.value))}
                    className="w-16 p-2 border border-gray-300 rounded-md text-center focus:ring-blue-500 focus:border-blue-500"
                    aria-label={`Quantity of ${item.name}`}
                  />
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col items-end space-y-4">
            <p className="text-2xl font-bold text-gray-800">Total: <span className="text-blue-700">${total.toFixed(2)}</span></p>
            <div className="flex space-x-4">
              <button
                onClick={onContinueShopping}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-md transition-colors duration-300"
              >
                Continue Shopping
              </button>
              <button
                onClick={onCheckout}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md transition-colors duration-300"
                aria-label="Proceed to checkout"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BasketView;