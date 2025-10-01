import React from "react";
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './cart';

// Set up fake for local storage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('CartContext', () => {
  // clear the fake before each test
  beforeEach(() => {
    localStorage.clear();
  });

  describe('CartProvider', () => {
    it('should provide initial empty cart when no localStorage data exists', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const [cart] = result.current;
      expect(cart).toEqual([]);
    });

    it('should load cart from localStorage', async () => {
      const mockCart = [
        { id: 1, name: 'Product 1', quantity: 2 },
        { id: 2, name: 'Product 2', quantity: 1 },
      ];
      localStorage.setItem('cart', JSON.stringify(mockCart));

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      await waitFor(() => {
        const [cart] = result.current;
        expect(cart).toEqual(mockCart);
      });
    });

    it('should provide setCart function to update cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const [, setCart] = result.current;
      const newCart = [{ id: 1, name: 'New Product', quantity: 1 }];

      act(() => {
        setCart(newCart);
      });

      const [cart] = result.current;
      expect(cart).toEqual(newCart);
    });

    it('should allow updating cart with a function', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        const [, setCart] = result.current;
        setCart([{ id: 1, name: 'Product 1', quantity: 1 }]);
      });

      act(() => {
        const [, setCart] = result.current;
        setCart((prevCart) => [...prevCart, { id: 2, name: 'Product 2', quantity: 2 }]);
      });

      const [cart] = result.current;
      expect(cart).toHaveLength(2);
      expect(cart[1]).toEqual({ id: 2, name: 'Product 2', quantity: 2 });
    });
  });

  describe('useCart hook', () => {
    it('should return cart and setCart function', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current).toHaveLength(2);
      expect(Array.isArray(result.current[0])).toBe(true);
      expect(typeof result.current[1]).toBe('function');
    });
  });

  describe('localStorage integration', () => {
    it('should only get item from localStorage `cart` once', () => {
      const getItemSpy = jest.spyOn(localStorage, 'getItem');
      localStorage.setItem('cart', JSON.stringify([{ id: 1 }]));

      renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(getItemSpy).toHaveBeenCalledTimes(1);
      expect(getItemSpy).toHaveBeenCalledWith('cart');

      getItemSpy.mockRestore();
    });

    it('should handle null localStorage value', async () => {
      localStorage.removeItem('cart');

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      await waitFor(() => {
        const [cart] = result.current;
        expect(cart).toEqual([]);
      });
    });

    it('should handle empty string in localStorage', () => {
      localStorage.setItem('cart', '');

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const [cart] = result.current;
      expect(cart).toEqual([]);
    });
  });
});