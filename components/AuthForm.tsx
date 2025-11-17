import React, { useState } from 'react';
import { User, UserRole } from '../types';

// Fix: Make onLogin and onSignup optional in AuthFormProps.
// The AuthForm component will conditionally use these props based on its 'type'.
// Runtime checks are added within handleSubmit to ensure the appropriate function is called.
interface AuthFormProps {
  type: 'login' | 'signup';
  onAuthSuccess: (user: User) => void;
  onNavigate: (view: 'login' | 'signup' | 'home') => void;
  users: User[]; // For client-side validation
  onLogin?: (email: string, password: string) => User | false;
  onSignup?: (name: string, phone: string, email: string, password: string, role: UserRole) => User | false;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onAuthSuccess, onNavigate, users, onLogin, onSignup }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('retailer');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (type === 'login') {
      // Fix: Add a runtime check to ensure onLogin is provided before calling it.
      if (!onLogin) {
        setError('Login functionality is not available. Please contact support.');
        console.error('onLogin prop is missing for login type AuthForm.');
        return;
      }
      const user = onLogin(email, password);
      if (user) {
        onAuthSuccess(user);
      } else {
        setError('Invalid email or password.');
      }
    } else { // signup
      if (!name || !phone || !email || !password) {
        setError('Please fill in all fields.');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      // Fix: Add a runtime check to ensure onSignup is provided before calling it.
      if (!onSignup) {
        setError('Signup functionality is not available. Please contact support.');
        console.error('onSignup prop is missing for signup type AuthForm.');
        return;
      }
      const user = onSignup(name, phone, email, password, role);
      if (user) {
        onAuthSuccess(user);
      } else {
        setError('Signup failed. User with this email might already exist.');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-md my-12 p-8 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
        {type === 'login' ? 'Login to AutoParts Nexus Pro' : 'Sign Up for AutoParts Nexus Pro'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {type === 'signup' && (
          <>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400"
                required
                aria-required="true"
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400"
            required
            aria-required="true"
          />
        </div>
        {type === 'signup' && (
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white"
              required
              aria-required="true"
            >
              <option value="retailer" className="bg-gray-800 text-white">Retailer</option>
              <option value="supplier" className="bg-gray-800 text-white">Supplier</option>
            </select>
          </div>
        )}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md shadow-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {type === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <div className="mt-6 text-center text-gray-600">
        {type === 'login' ? (
          <p>Don't have an account? <button onClick={() => onNavigate('signup')} className="text-blue-600 hover:underline font-medium">Sign Up</button></p>
        ) : (
          <p>Already have an account? <button onClick={() => onNavigate('login')} className="text-blue-600 hover:underline font-medium">Login</button></p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;