// This file contains unit tests generated with AI assistance but curated, validated and refined by me.
import React from "react";
import { act, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth";

const TestComponent = () => {
  const [auth] = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.name : "null"}</span>
      <span data-testid="token">{auth.token || "empty"}</span>
    </div>
  );
};

describe("AuthProvider Equivalence Partitioning and BVA", () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
  };

  beforeAll(() => {
    Object.defineProperty(global, "localStorage", {
      value: localStorageMock,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns default state when no auth exists in localStorage", () => {
    localStorage.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  it("falls back to default state when localStorage contains invalid JSON", () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    localStorage.getItem.mockReturnValue("not-json");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("empty");

    consoleSpy.mockRestore();
  });

  it("sets auth state to empty values when JSON is valid but missing user/token", () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ foo: "bar" }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  it("handles auth state when JSON has user but explicitly null token", () => {
    localStorage.getItem.mockReturnValue(
      JSON.stringify({ user: { name: "Dave" }, token: null })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("Dave");
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  it("handles auth state when JSON has user but undefined token", () => {
    localStorage.getItem.mockReturnValue(
      JSON.stringify({ user: { name: "Eve" }, token: undefined })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("Eve");
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  it("handles auth state when JSON has user but empty string token", () => {
    localStorage.getItem.mockReturnValue(
      JSON.stringify({ user: { name: "Frank" }, token: "" })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("Frank");
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  it("initializes auth state when JSON contains valid user and token", () => {
    localStorage.getItem.mockReturnValue(
      JSON.stringify({ user: { name: "Alice" }, token: "abc123" })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("Alice");
    expect(screen.getByTestId("token").textContent).toBe("abc123");
  });

  it("propagates auth state to all child components", () => {
    localStorage.getItem.mockReturnValue(null);

    const ChildComponent1 = () => {
      const [auth] = useAuth();
      return <span data-testid="token1">{auth.token || "empty"}</span>;
    };

    const ChildComponent2 = () => {
      const [auth, setAuth] = useAuth();
      return (
        <div>
          <span data-testid="token2">{auth.token || "empty"}</span>
          <button
            data-testid="update-token"
            onClick={() => setAuth({ user: null, token: "new-token" })}
          >
            Update
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <ChildComponent1 />
        <ChildComponent2 />
      </AuthProvider>
    );

    expect(screen.getByTestId("token1").textContent).toBe("empty");
    expect(screen.getByTestId("token2").textContent).toBe("empty");

    //ChildComponent2 updates the token
    act(() => {
      screen.getByTestId("update-token").click();
    });

    expect(screen.getByTestId("token1").textContent).toBe("new-token");
    expect(screen.getByTestId("token2").textContent).toBe("new-token");
  });
});
