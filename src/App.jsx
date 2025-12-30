import React, { useState, useEffect } from 'react';
import MerchantLogin from './pages/MerchantLogin';
import CustomerTerminal from './pages/CustomerTerminal';
import { store } from './lib/store';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(store.isLoggedIn());
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    store.logout();
    setIsLoggedIn(false);
  };

  return (
    <div>
      {isLoggedIn ? (
        <CustomerTerminal onLogout={handleLogout} />
      ) : (
        <MerchantLogin onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
