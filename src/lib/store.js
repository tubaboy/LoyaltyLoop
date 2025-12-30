export const store = {
    // Key for localStorage
    KEYS: {
        CUSTOMERS: 'loyalty_customers',
        MERCHANT: 'loyalty_merchant',
    },

    // Get all customers (Map-like object: { phone: points })
    getCustomers: () => {
        try {
            return JSON.parse(localStorage.getItem('loyalty_customers')) || {};
        } catch {
            return {};
        }
    },

    // Get points for a specific phone
    getPoints: (phone) => {
        const customers = store.getCustomers();
        return customers[phone] || 0;
    },

    // Add points
    addPoints: (phone, amount = 1) => {
        const customers = store.getCustomers();
        const current = customers[phone] || 0;
        customers[phone] = current + amount;
        localStorage.setItem('loyalty_customers', JSON.stringify(customers));
        return customers[phone];
    },

    // Redeem points
    redeemPoints: (phone, amount) => {
        const customers = store.getCustomers();
        const current = customers[phone] || 0;
        if (current < amount) return false;
        customers[phone] = current - amount;
        localStorage.setItem('loyalty_customers', JSON.stringify(customers));
        return customers[phone];
    },

    // Mock Login
    login: (merchantId) => {
        localStorage.setItem('loyalty_merchant', merchantId);
        return true;
    },

    logout: () => {
        localStorage.removeItem('loyalty_merchant');
    },

    isLoggedIn: () => {
        return !!localStorage.getItem('loyalty_merchant');
    }
};
