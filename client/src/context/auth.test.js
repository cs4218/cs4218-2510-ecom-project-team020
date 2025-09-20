import React from "react";
import { render, screen } from "@testing-library/react";
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

describe("AuthProvider", () => {
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

  test("returns default state when no auth exists in localStorage", () => {
    localStorage.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  test("falls back to default state when localStorage contains invalid JSON", () => {
    localStorage.getItem.mockReturnValue("not-json");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  test("sets auth state to empty values when JSON is valid but missing user/token", () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ foo: "bar" }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  test("initializes auth state when JSON contains valid user and token", () => {
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
});
