
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ProductGrid from './components/ProductGrid';
import GeminiAssistant from './components/GeminiAssistant';
import Footer from './components/Footer';
import { INITIAL_PRODUCTS, DUMMY_SUPPLIERS, DUMMY_ADMIN } from './constants';
import { Product, AssistantMessage, User, CartItem, Transaction, OrderItem, UserRole } from './types';
import { askGemini } from './services/geminiService';
import AuthForm from './components/AuthForm';
import BasketView from './components/BasketView';
import SupplierDashboard from './components/ShopOwnerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ReceiptModal from './components/ReceiptModal';
import { applyPageTranslation } from './utils/domTranslationUtils'; // Import the new translation utility

type AppView =
  | 'home'
  | 'login'
  | 'signup'
  | 'retailerHome'
  | 'basket'
  | 'supplierProducts'
  | 'adminUsers'
  | 'adminTransactions';

const App: React.FC = () => {
  // Global State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]
  );
  // Language translation state
  const [isArabic, setIsArabic] = useState<boolean>(() => {
    const storedLanguage = localStorage.getItem('autogenai_isArabic');
    return storedLanguage === 'true';
  });
  const [isTranslating, setIsTranslating] = useState<boolean>(false);


  // UI State
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [isAssistantTyping, setIsAssistantTyping] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [lastTransactionDetails, setLastTransactionDetails] = useState<Transaction[] | null>(null);

  const messageIdCounter = useRef(0);
  const userIdCounter = useRef(0);
  // Fix: Declare productIdCounter using useRef.
  const productIdCounter = useRef(0);
  const transactionIdCounter = useRef(0);

  // --- Persistence with localStorage ---
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('autogenai_users') || '[]') as User[];
    const storedProducts = JSON.parse(localStorage.getItem('autogenai_products') || '[]') as Product[];
    const storedTransactions = JSON.parse(localStorage.getItem('autogenai_transactions') || '[]') as Transaction[];
    const storedCurrentUser = JSON.parse(localStorage.getItem('autogenai_currentUser') || 'null') as User | null;

    if (storedUsers.length === 0) {
      setUsers([...DUMMY_SUPPLIERS, DUMMY_ADMIN]);
    } else {
      setUsers(storedUsers);
    }

    // --- MODIFICATION START ---
    // Initialize products as an empty array if nothing is in local storage,
    // so the main page is empty until suppliers upload.
    setProducts(storedProducts);
    // --- MODIFICATION END ---

    setTransactions(storedTransactions);
    setCurrentUser(storedCurrentUser);

    // Initialize counters
    userIdCounter.current = storedUsers.length > 0 ? Math.max(...storedUsers.map(u => parseInt(u.id.split('-')[1]))) + 1 : 1;
    // Fix: Explicitly ensure that product IDs are parsed as numbers and that the
    // resulting maximum value is treated as a number before incrementing. This helps
    // prevent potential 'unknown' type inference issues that might arise in specific
    // TypeScript configurations, which sometimes report 'unknown' not assignable to 'string'
    // when numbers are expected, even if the direct types appear correct. The `isNaN` check
    // adds robustness against malformed `id` strings in `localStorage`.
    productIdCounter.current = storedProducts.length > 0
      ? Math.max(...storedProducts.map(p => {
          // Ensure p.id is a string before attempting parseInt.
          // If it's not a string (e.g., unknown or another type from malformed localStorage data),
          // treat it as an empty string to avoid runtime errors with parseInt.
          const idStr = typeof p.id === 'string' ? p.id : '';
          const idNum = parseInt(idStr, 10);
          return isNaN(idNum) ? 0 : idNum;
        })) + 1
      : 1;
    transactionIdCounter.current = storedTransactions.length > 0 ? Math.max(...storedTransactions.map(t => parseInt(t.id))) + 1 : 1;
  }, []);

  useEffect(() => {
    localStorage.setItem('autogenai_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('autogenai_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('autogenai_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('autogenai_currentUser', JSON.stringify(currentUser));
    if (currentUser) {
      if (currentUser.role === 'retailer') {
        setCurrentView('retailerHome');
      } else if (currentUser.role === 'supplier') {
        setCurrentView('supplierProducts'); // Always navigate to products for suppliers
      } else if (currentUser.role === 'admin') {
        setCurrentView('adminUsers');
      }
    } else {
      setCurrentView('home');
    }
  }, [currentUser]);

  // --- Language Translation Effect ---
  useEffect(() => {
    localStorage.setItem('autogenai_isArabic', isArabic.toString());
    applyPageTranslation(isArabic ? 'ar' : 'en', setIsTranslating);
  }, [isArabic, currentView]); // Rerun translation when language or view changes

  // --- Auth Functions ---
  // Fix: Return the user object on success, or false on failure.
  const handleLogin = useCallback((email: string, password: string): User | false => {
    // Add runtime type guards for safety, especially with data from localStorage
    const user = users.find(u => {
      // Ensure email and password are strings before comparison
      if (typeof u.email !== 'string' || typeof u.password !== 'string') {
        // Fix: Safely interpolate u.id by checking its type before using it in the template literal.
        console.warn(`User object with malformed email or password found for ID: ${typeof u.id === 'string' ? u.id : 'unknown'}. Skipping.`);
        return false; // Skip this user if types are incorrect
      }
      return u.email === email && u.password === password;
    });
    if (user) {
      setCurrentUser(user);
      return user;
    }
    return false;
  }, [users]);

  // Fix: Return the newUser object on success, or false on failure.
  const handleSignup = useCallback((name: string, phone: string, email: string, password: string, role: UserRole): User | false => {
    if (users.some(u => u.email === email)) {
      alert('User with this email already exists.');
      return false;
    }
    const newUser: User = {
      id: `${role}-${userIdCounter.current++}`,
      name,
      phone,
      email,
      password, // Stored client-side for simulation; would be hashed/salted in a real backend
      role,
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser); // Log in new user immediately
    return newUser;
  }, [users]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCart([]); // Clear cart on logout
  }, []);

  // --- Product Filtering for Retailer/Home View ---
  const filteredProducts = useMemo(() => {
    if (currentView === 'home' || currentView === 'retailerHome') {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(lowercasedSearchTerm) ||
          product.description.toLowerCase().includes(lowercasedSearchTerm) ||
          product.category.toLowerCase().includes(lowercasedSearchTerm) ||
          product.vehicleType.toLowerCase().includes(lowercasedSearchTerm) ||
          product.shopName.toLowerCase().includes(lowercasedSearchTerm) ||
          product.partNumber.toLowerCase().includes(lowercasedSearchTerm) || // New search field
          product.make.toLowerCase().includes(lowercasedSearchTerm) ||       // New search field
          product.model.toLowerCase().includes(lowercasedSearchTerm) ||      // New search field
          product.year.toString().includes(lowercasedSearchTerm)             // New search field
      );
    }
    return [];
  }, [searchTerm, products, currentView]);

  // --- Cart Management (Retailer only) ---
  const handleAddToCart = useCallback((product: Product) => {
    if (!currentUser || currentUser.role !== 'retailer') {
      alert('Please log in as a retailer to add items to your cart.');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.quantityAvailable) {
          return prevCart.map(item =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          alert(`Maximum stock for ${product.name} reached.`);
          return prevCart;
        }
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            shopId: product.shopId,
            shopName: product.shopName,
            quantity: 1,
            imageUrl: product.imageUrl,
            maxQuantity: product.quantityAvailable,
          },
        ];
      }
    });
  }, [currentUser]);

  const handleUpdateCartQuantity = useCallback((productId: string, newQuantity: number) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.productId === productId);
      if (!itemToUpdate) return prevCart;

      if (newQuantity <= 0) {
        return prevCart.filter(item => item.productId !== productId);
      }
      if (newQuantity > itemToUpdate.maxQuantity) {
        alert(`Cannot add more than available stock for ${itemToUpdate.name}.`);
        return prevCart;
      }

      return prevCart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  }, []);

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  }, []);

  const handleCheckout = useCallback(() => {
    if (!currentUser || currentUser.role !== 'retailer') {
      alert('Only retailers can complete a purchase.');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    const newTransactions: Transaction[] = [];
    const updatedProducts = [...products];
    const shopsInCart = Array.from(new Set(cart.map(item => item.shopId)));

    shopsInCart.forEach(shopId => {
      const itemsFromThisShop = cart.filter(item => item.shopId === shopId);
      if (itemsFromThisShop.length === 0) return;

      const shopName = itemsFromThisShop[0].shopName;
      const transactionItems: OrderItem[] = [];
      let totalAmount = 0;

      itemsFromThisShop.forEach(cartItem => {
        const productIndex = updatedProducts.findIndex(p => p.id === cartItem.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex].quantityAvailable -= cartItem.quantity;
          transactionItems.push({
            productId: cartItem.productId,
            name: cartItem.name,
            price: cartItem.price,
            shopId: cartItem.shopId,
            shopName: cartItem.shopName,
            quantity: cartItem.quantity,
            imageUrl: cartItem.imageUrl,
          });
          totalAmount += cartItem.price * cartItem.quantity;
        }
      });

      if (transactionItems.length > 0) {
        newTransactions.push({
          id: `${transactionIdCounter.current++}`,
          retailerId: currentUser.id, // Changed from customerId
          retailerName: currentUser.name, // Changed from customerName
          // Fix: Assert `shopId` as `string` to resolve potential `unknown` type inference issues.
          shopId: shopId as string,
          shopName: shopName,
          items: transactionItems,
          totalAmount: totalAmount,
          transactionDate: new Date().toISOString(),
        });
      }
    });

    setTransactions(prev => [...prev, ...newTransactions]);
    setProducts(updatedProducts);
    setCart([]); // Clear cart after successful checkout
    setLastTransactionDetails(newTransactions);
    setShowReceipt(true);
  }, [currentUser, cart, products, transactions]);

  // --- Supplier Functions ---
  const handleAddProduct = useCallback((newProduct: Omit<Product, 'id' | 'shopId' | 'shopName'> & { shopId?: string; shopName?: string }) => {
    if (!currentUser || currentUser.role !== 'supplier') {
      alert('Only suppliers can add products.');
      return;
    }
    const productToAdd: Product = {
      id: `${productIdCounter.current++}`,
      shopId: currentUser.id,
      shopName: currentUser.name,
      ...newProduct,
      // Ensure default values for fields not from CSV if they are missing
      imageUrl: newProduct.imageUrl || 'https://picsum.photos/300/200?random=' + Math.floor(Math.random() * 1000),
      category: newProduct.category || 'Uncategorized',
      vehicleType: newProduct.vehicleType || `${newProduct.make || ''} ${newProduct.model || ''} ${newProduct.year || ''}`.trim() || 'General',
    };
    setProducts(prev => [...prev, productToAdd]);
    alert('Product added successfully!');
  }, [currentUser]);

  const handleUpdateProduct = useCallback((updatedProduct: Product) => {
    if (!currentUser || currentUser.role !== 'supplier' || updatedProduct.shopId !== currentUser.id) {
      alert('You do not have permission to update this product.');
      return;
    }
    setProducts(prev => prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
    alert('Product updated successfully!');
  }, [currentUser]);

  const handleDeleteProduct = useCallback((productId: string) => {
    if (!currentUser || currentUser.role !== 'supplier') {
      alert('Only suppliers can delete products.');
      return;
    }
    const productToDelete = products.find(p => p.id === productId);
    if (productToDelete && productToDelete.shopId !== currentUser.id) {
      alert('You do not have permission to delete this product.');
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
    alert('Product deleted successfully!');
  }, [currentUser, products]);


  // --- Admin Functions ---
  const handleRemoveUser = useCallback((userIdToRemove: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Only admins can remove users.');
      return;
    }
    if (userIdToRemove === currentUser.id) {
      alert('You cannot remove yourself.');
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userIdToRemove));
    // Also remove associated products if it was a supplier
    setProducts(prev => prev.filter(p => p.shopId !== userIdToRemove));
    // Also remove associated transactions
    setTransactions(prev => prev.filter(t => t.retailerId !== userIdToRemove && t.shopId !== userIdToRemove));
    alert('User and associated data removed.');
  }, [currentUser]);

  // --- Gemini Assistant ---
  const toggleAssistant = useCallback(() => {
    setIsAssistantOpen((prev) => !prev);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    messageIdCounter.current += 1;
    const newMessageId = `user-${messageIdCounter.current}`;
    setAssistantMessages((prevMessages) => [
      ...prevMessages,
      { id: newMessageId, text: message, isUser: true },
    ]);
    setIsAssistantTyping(true);

    try {
      const aiResponse = await askGemini(message);
      messageIdCounter.current += 1;
      const aiMessageId = `ai-${messageIdCounter.current}`;
      setAssistantMessages((prevMessages) => [
        ...prevMessages,
        { id: aiMessageId, text: aiResponse, isUser: false },
      ]);
    } catch (error) {
      console.error('Error in AI assistant:', error);
      messageIdCounter.current += 1;
      const errorMessageId = `ai-error-${messageIdCounter.current}`;
      setAssistantMessages((prevMessages) => [
        ...prevMessages,
        { id: errorMessageId, text: 'Oops! Something went wrong. Please try again.', isUser: false },
      ]);
    } finally {
      setIsAssistantTyping(false);
    }
  }, []);

  // --- Language Toggle Function ---
  const handleLanguageToggle = useCallback(() => {
    setIsArabic(prev => !prev);
  }, []);

  const navigate = useCallback((view: AppView) => {
    setSearchTerm(''); // Clear search on navigation
    setCurrentView(view);
  }, []);

  // Conditional Rendering Logic for Main Content
  const renderMainContent = () => {
    switch (currentView) {
      case 'login':
        return <AuthForm type="login" onAuthSuccess={setCurrentUser} onNavigate={navigate} users={users} onLogin={handleLogin} />;
      case 'signup':
        return <AuthForm type="signup" onAuthSuccess={setCurrentUser} onNavigate={navigate} users={users} onSignup={handleSignup} />;
      case 'basket':
        if (currentUser?.role !== 'retailer') {
          return <p className="text-center text-xl my-8">Access Denied. Only retailers can view the basket.</p>;
        }
        return (
          <BasketView
            cartItems={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onCheckout={handleCheckout}
            onContinueShopping={() => navigate('retailerHome')}
          />
        );
      case 'supplierProducts':
        if (currentUser?.role !== 'supplier') {
          return <p className="text-center text-xl my-8">Access Denied. Only suppliers can access this page.</p>;
        }
        return (
          <SupplierDashboard
            currentUser={currentUser}
            products={products}
            // transactions removed as per refined request for strict product focus
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            // Removed currentTab and onTabChange props
          />
        );
      case 'adminUsers':
      case 'adminTransactions':
        if (currentUser?.role !== 'admin') {
          return <p className="text-center text-xl my-8">Access Denied. Only admins can access this page.</p>;
        }
        return (
          <AdminDashboard
            users={users}
            transactions={transactions}
            onRemoveUser={handleRemoveUser}
            currentTab={currentView === 'adminUsers' ? 'users' : 'transactions'}
            onTabChange={(tab) => navigate(tab === 'users' ? 'adminUsers' : 'adminTransactions')}
          />
        );
      case 'home': // Public home view
      case 'retailerHome': // Retailer's home view
      default:
        return (
          <>
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <ProductGrid products={filteredProducts} currentUser={currentUser} onAddToCart={handleAddToCart} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentUser={currentUser}
        onToggleAssistant={toggleAssistant}
        onLogout={handleLogout}
        onNavigate={navigate}
        cartItemCount={cart.length}
        isArabic={isArabic}
        onLanguageToggle={handleLanguageToggle}
        isTranslating={isTranslating}
      />
      <main className="flex-grow">
        {renderMainContent()}
      </main>
      <GeminiAssistant
        isOpen={isAssistantOpen}
        onClose={toggleAssistant}
        messages={assistantMessages}
        onSendMessage={handleSendMessage}
        isTyping={isAssistantTyping}
      />
      {showReceipt && lastTransactionDetails && (
        <ReceiptModal
          transactions={lastTransactionDetails}
          onClose={() => setShowReceipt(false)}
        />
      )}
      <Footer />
    </div>
  );
};

export default App;