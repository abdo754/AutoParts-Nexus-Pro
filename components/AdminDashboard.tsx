import React from 'react';
import { User, Transaction } from '../types';

interface AdminDashboardProps {
  users: User[];
  transactions: Transaction[];
  onRemoveUser: (userId: string) => void;
  currentTab: 'users' | 'transactions';
  onTabChange: (tab: 'users' | 'transactions') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  transactions,
  onRemoveUser,
  currentTab,
  onTabChange,
}) => {
  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-blue-700 mb-6 border-b pb-4">Admin Panel</h2>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => onTabChange('users')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg ${
              currentTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-current={currentTab === 'users' ? 'page' : undefined}
          >
            User Management
          </button>
          <button
            onClick={() => onTabChange('transactions')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg ${
              currentTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-current={currentTab === 'transactions' ? 'page' : undefined}
          >
            All Transactions
          </button>
        </nav>
      </div>

      {currentTab === 'users' && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Registered Users ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3">ID</th>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Phone</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{user.role.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.role !== 'admin' && ( // Admins cannot remove other admins or themselves
                        <button
                          onClick={() => { if (window.confirm(`Are you sure you want to remove ${user.name} (${user.role})?`)) onRemoveUser(user.id); }}
                          className="text-red-600 hover:text-red-900"
                          aria-label={`Remove user ${user.name}`}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === 'transactions' && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">All Transactions ({transactions.length})</h3>
          {transactions.length === 0 ? (
            <p className="text-gray-600">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th scope="col" className="px-6 py-3">Trans. ID</th>
                    <th scope="col" className="px-6 py-3">Retailer</th>
                    <th scope="col" className="px-6 py-3">Shop</th>
                    <th scope="col" className="px-6 py-3">Items</th>
                    <th scope="col" className="px-6 py-3">Total Amount</th>
                    <th scope="col" className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{transaction.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.retailerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.shopName}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <ul className="list-disc list-inside space-y-1">
                          {transaction.items.map((item) => (
                            <li key={item.productId}>{item.name} (x{item.quantity})</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-700">${transaction.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;