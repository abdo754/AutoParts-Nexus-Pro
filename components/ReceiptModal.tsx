import React from 'react';
import { Transaction } from '../types';

interface ReceiptModalProps {
  transactions: Transaction[]; // Can be multiple transactions if cart had items from different shops
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ transactions, onClose }) => {
  const totalPurchaseAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 relative">
        <h2 id="receipt-title" className="text-3xl font-bold text-blue-700 mb-6 border-b pb-4 text-center">
          Purchase Receipt
        </h2>

        {transactions.map((transaction, index) => (
          <div key={transaction.id} className="mb-6 last:mb-0 p-4 border border-gray-200 rounded-md">
            <p className="text-lg font-semibold text-gray-800 mb-2">Order from: {transaction.shopName}</p>
            <p className="text-sm text-gray-600 mb-3">Transaction ID: {transaction.id}</p>
            <div className="space-y-3">
              {transaction.items.map((item) => (
                <div key={item.productId} className="flex items-center">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-sm mr-4" />
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-blue-700">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-right text-lg font-bold text-gray-800">
              Subtotal: <span className="text-blue-700">${transaction.totalAmount.toFixed(2)}</span>
            </p>
          </div>
        ))}

        <div className="mt-6 pt-4 border-t border-gray-200 text-right">
          <p className="text-2xl font-bold text-gray-900">
            Grand Total: <span className="text-orange-500">${totalPurchaseAmount.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Purchased on: {new Date(transactions[0].transactionDate).toLocaleString()}
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md shadow-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Close receipt"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ReceiptModal;