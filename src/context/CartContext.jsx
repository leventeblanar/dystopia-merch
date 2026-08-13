import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (newItem) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.variantId === newItem.variantId
      );

      if (!existingItem) {
        return [...currentItems, newItem];
      }

      return currentItems.map((item) => {
        if (item.variantId !== newItem.variantId) {
          return item;
        }

        return {
          ...item,
          quantity: Math.min(
            item.quantity + newItem.quantity,
            newItem.stock
          ),
        };
      });
    });
  };

  const removeFromCart = (variantId) => {
  setCartItems((currentItems) =>
    currentItems.filter(
      (item) => item.variantId !== variantId
    )
  );
};


const increaseCartQuantity = (variantId) => {
  setCartItems((currentItems) =>
    currentItems.map((item) => {
      if (item.variantId !== variantId) {
        return item;
      }

      return {
        ...item,
        quantity: Math.min(
          item.quantity + 1,
          item.stock
        ),
      };
    })
  );
};


const decreaseCartQuantity = (variantId) => {
  setCartItems((currentItems) =>
    currentItems.map((item) => {
      if (item.variantId !== variantId) {
        return item;
      }

      return {
        ...item,
        quantity: Math.max(
          item.quantity - 1,
          1
        ),
      };
    })
  );
};

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseCartQuantity,
        decreaseCartQuantity,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}