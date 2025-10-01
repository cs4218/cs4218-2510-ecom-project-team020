import React from "react";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { SearchProvider, useSearch } from "./search";

// Note: Window objects are mocked globally in setupTests.js

describe("Search Context", () => {
  describe("SearchProvider", () => {
    it("should render children without errors", () => {
      render(
        <SearchProvider>
          <div data-testid="test-child">Test Child</div>
        </SearchProvider>
      );

      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("should provide search context to children", () => {
      let contextValue;

      const TestComponent = () => {
        contextValue = useSearch();
        return <div>Test</div>;
      };

      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      expect(contextValue).toBeDefined();
      expect(Array.isArray(contextValue)).toBe(true);
      expect(contextValue).toHaveLength(2);
    });

    it("should provide initial search state", () => {
      let searchState;

      const TestComponent = () => {
        const [state] = useSearch();
        searchState = state;
        return <div>Test</div>;
      };

      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      expect(searchState).toEqual({
        keyword: "",
        results: [],
      });
    });

    it("should provide setState function", () => {
      let setSearchState;

      const TestComponent = () => {
        const [, setState] = useSearch();
        setSearchState = setState;
        return <div>Test</div>;
      };

      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      expect(typeof setSearchState).toBe("function");
    });
  });

  describe("useSearch Hook", () => {
    it("should return undefined when used outside SearchProvider", () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current).toBeUndefined();
    });

    it("should return initial state when used within provider", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      expect(result.current[0]).toEqual({
        keyword: "",
        results: [],
      });
      expect(typeof result.current[1]).toBe("function");
    });

    it("should update keyword state", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        const [state, setState] = result.current;
        setState({
          ...state,
          keyword: "test keyword",
        });
      });

      expect(result.current[0].keyword).toBe("test keyword");
      expect(result.current[0].results).toEqual([]);
    });

    it("should update results state", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const mockResults = [
        { _id: "1", name: "Product 1", price: 100 },
        { _id: "2", name: "Product 2", price: 200 },
      ];

      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        const [state, setState] = result.current;
        setState({
          ...state,
          results: mockResults,
        });
      });

      expect(result.current[0].results).toEqual(mockResults);
      expect(result.current[0].keyword).toBe("");
    });

    it("should update both keyword and results simultaneously", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const mockResults = [{ _id: "1", name: "Search Result 1", price: 50 }];

      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        const [, setState] = result.current;
        setState({
          keyword: "search term",
          results: mockResults,
        });
      });

      expect(result.current[0]).toEqual({
        keyword: "search term",
        results: mockResults,
      });
    });

    it("should handle empty results array", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        const [state, setState] = result.current;
        setState({
          ...state,
          keyword: "no results",
          results: [],
        });
      });

      expect(result.current[0]).toEqual({
        keyword: "no results",
        results: [],
      });
    });

    it("should handle complex search results with full product data", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const complexResults = [
        {
          _id: "507f1f77bcf86cd799439011",
          name: "Complex Product 1",
          description: "Detailed description for product 1",
          price: 299.99,
          category: { _id: "cat1", name: "Electronics" },
          quantity: 5,
          slug: "complex-product-1",
        },
        {
          _id: "507f1f77bcf86cd799439012",
          name: "Complex Product 2",
          description: "Detailed description for product 2",
          price: 199.99,
          category: { _id: "cat2", name: "Books" },
          quantity: 10,
          slug: "complex-product-2",
        },
      ];

      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        const [, setState] = result.current;
        setState({
          keyword: "complex search",
          results: complexResults,
        });
      });

      expect(result.current[0].results).toHaveLength(2);
      expect(result.current[0].results[0]).toHaveProperty("_id");
      expect(result.current[0].results[0]).toHaveProperty("category");
      expect(result.current[0].results[1].price).toBe(199.99);
    });

    it("should maintain state across multiple updates", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      // First update - set keyword
      act(() => {
        const [state, setState] = result.current;
        setState({
          ...state,
          keyword: "first search",
        });
      });

      expect(result.current[0].keyword).toBe("first search");

      // Second update - add results
      act(() => {
        const [state, setState] = result.current;
        setState({
          ...state,
          results: [{ _id: "1", name: "Result 1" }],
        });
      });

      expect(result.current[0].keyword).toBe("first search");
      expect(result.current[0].results).toHaveLength(1);

      // Third update - change keyword but keep results
      act(() => {
        const [state, setState] = result.current;
        setState({
          ...state,
          keyword: "updated search",
        });
      });

      expect(result.current[0].keyword).toBe("updated search");
      expect(result.current[0].results).toHaveLength(1);
    });

    it("should handle state reset", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      // Set some state
      act(() => {
        const [, setState] = result.current;
        setState({
          keyword: "test",
          results: [{ _id: "1", name: "Test" }],
        });
      });

      expect(result.current[0].keyword).toBe("test");
      expect(result.current[0].results).toHaveLength(1);

      // Reset state
      act(() => {
        const [, setState] = result.current;
        setState({
          keyword: "",
          results: [],
        });
      });

      expect(result.current[0]).toEqual({
        keyword: "",
        results: [],
      });
    });
  });

  describe("Context Integration", () => {
    it("should share state between multiple consumers", () => {
      let firstConsumerState;
      let secondConsumerState;
      let sharedSetState;

      const FirstConsumer = () => {
        const [state, setState] = useSearch();
        firstConsumerState = state;
        sharedSetState = setState;
        return <div data-testid="first-consumer">First: {state.keyword}</div>;
      };

      const SecondConsumer = () => {
        const [state] = useSearch();
        secondConsumerState = state;
        return <div data-testid="second-consumer">Second: {state.keyword}</div>;
      };

      render(
        <SearchProvider>
          <FirstConsumer />
          <SecondConsumer />
        </SearchProvider>
      );

      // Initially both should have the same state
      expect(firstConsumerState).toEqual(secondConsumerState);

      // Update state through first consumer
      act(() => {
        sharedSetState({
          keyword: "shared search",
          results: [],
        });
      });

      // Both consumers should see the update
      expect(screen.getByText("First: shared search")).toBeInTheDocument();
      expect(screen.getByText("Second: shared search")).toBeInTheDocument();
    });

    it("should handle nested providers correctly", () => {
      let outerState;
      let innerState;

      const OuterConsumer = () => {
        const [state] = useSearch();
        outerState = state;
        return <div>Outer: {state.keyword}</div>;
      };

      const InnerConsumer = () => {
        const [state] = useSearch();
        innerState = state;
        return <div>Inner: {state.keyword}</div>;
      };

      render(
        <SearchProvider>
          <OuterConsumer />
          <SearchProvider>
            <InnerConsumer />
          </SearchProvider>
        </SearchProvider>
      );

      // Each provider should maintain its own state
      expect(outerState).toEqual({ keyword: "", results: [] });
      expect(innerState).toEqual({ keyword: "", results: [] });

      // They should be different instances
      expect(outerState).not.toBe(innerState);
    });

    it("should handle provider unmounting gracefully", () => {
      const TestComponent = () => {
        const [state] = useSearch();
        return <div>{state.keyword}</div>;
      };

      const { unmount } = render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle invalid state updates gracefully", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      // Try to set invalid state (should still work due to React's flexibility)
      act(() => {
        const [, setState] = result.current;
        setState(null);
      });

      // State should be null (React allows this)
      expect(result.current[0]).toBeNull();
    });

    it("should handle undefined state updates", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        const [, setState] = result.current;
        setState(undefined);
      });

      expect(result.current[0]).toBeUndefined();
    });

    it("should handle partial state updates", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      // Update only keyword (missing results)
      act(() => {
        const [, setState] = result.current;
        setState({
          keyword: "partial update",
        });
      });

      expect(result.current[0]).toEqual({
        keyword: "partial update",
      });
    });

    it("should handle state updates with extra properties", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        const [, setState] = result.current;
        setState({
          keyword: "extra props",
          results: [],
          extraProperty: "should be preserved",
          anotherExtra: 123,
        });
      });

      expect(result.current[0]).toEqual({
        keyword: "extra props",
        results: [],
        extraProperty: "should be preserved",
        anotherExtra: 123,
      });
    });
  });

  describe("Performance and Memory", () => {
    it("should handle large results arrays efficiently", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const largeResults = Array.from({ length: 1000 }, (_, index) => ({
        _id: `id-${index}`,
        name: `Product ${index}`,
        price: index * 10,
      }));

      const { result } = renderHook(() => useSearch(), { wrapper });

      act(() => {
        const [, setState] = result.current;
        setState({
          keyword: "large dataset",
          results: largeResults,
        });
      });

      expect(result.current[0].results).toHaveLength(1000);
      expect(result.current[0].results[999]).toEqual({
        _id: "id-999",
        name: "Product 999",
        price: 9990,
      });
    });

    it("should handle rapid state updates", () => {
      const wrapper = ({ children }) => (
        <SearchProvider>{children}</SearchProvider>
      );

      const { result } = renderHook(() => useSearch(), { wrapper });

      // Perform multiple rapid updates
      act(() => {
        const [, setState] = result.current;
        for (let i = 0; i < 10; i++) {
          setState({
            keyword: `search-${i}`,
            results: [],
          });
        }
      });

      // Should have the last update
      expect(result.current[0].keyword).toBe("search-9");
    });
  });
});
