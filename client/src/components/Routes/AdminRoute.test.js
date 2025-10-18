import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import AdminRoute from "./AdminRoute";

// Mock modules
jest.mock("axios");
jest.mock("../../context/auth");
jest.mock("../Spinner", () => {
  return function MockSpinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

// Import the mocked hooks
import { useAuth } from "../../context/auth";

const mockedAxios = axios;

// Test component to render inside AdminRoute
const TestComponent = () => <div data-testid="admin-content">Admin Content</div>;

// Helper function to render AdminRoute with Router context
const renderWithRouter = (authState = { user: null, token: null }) => {
  useAuth.mockReturnValue([authState, jest.fn()]);
  
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminRoute />}>
          <Route index element={<TestComponent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

describe("AdminRoute Component - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Output-Based Testing
  describe("Component Rendering", () => {
    it("should render Spinner when not authenticated", () => {
      // Arrange
      const authState = { user: null, token: null };
      
      // Act
      renderWithRouter(authState);
      
      // Assert
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });

    it("should render Spinner initially even with token before auth check completes", () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      // Act
      renderWithRouter(authState);
      
      // Assert
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });

    it("should render admin content when authentication succeeds", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockResolvedValue({ data: { ok: true } });
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("admin-content")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });

    it("should render Spinner when authentication fails", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "invalid-token" };
      mockedAxios.get.mockResolvedValue({ data: { ok: false } });
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });
  });

  // State-Based Testing
  describe("Authentication State Management", () => {
    it("should initialize with ok state as false", () => {
      // Arrange
      const authState = { user: null, token: null };
      
      // Act
      renderWithRouter(authState);
      
      // Assert - Component should render Spinner initially
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("should update ok state to true when auth check succeeds", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockResolvedValue({ data: { ok: true } });
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("admin-content")).toBeInTheDocument();
      });
    });

    it("should keep ok state as false when auth check fails", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "invalid-token" };
      mockedAxios.get.mockResolvedValue({ data: { ok: false } });
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });
  });

  // Interaction-Based Testing
  describe("API Interaction", () => {
    it("should call admin-auth endpoint when token is present", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockResolvedValue({ data: { ok: true } });
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
      });
    });

    it("should not call admin-auth endpoint when token is absent", () => {
      // Arrange
      const authState = { user: null, token: null };
      
      // Act
      renderWithRouter(authState);
      
      // Assert
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should not call admin-auth endpoint when token is empty string", () => {
      // Arrange
      const authState = { user: null, token: "" };
      
      // Act
      renderWithRouter(authState);
      
      // Assert
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should not call admin-auth endpoint when token is undefined", () => {
      // Arrange
      const authState = { user: null, token: undefined };
      
      // Act
      renderWithRouter(authState);
      
      // Assert
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  // Error Handling Testing
  describe("Error Handling", () => {
    it("should handle API errors gracefully and show Spinner", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockRejectedValue(new Error("Network error"));
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      }, { timeout: 1000 });
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });

    it("should handle malformed API response and show Spinner", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockResolvedValue({ data: {} }); // Missing 'ok' property
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });

    it("should handle null response data and show Spinner", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockResolvedValue({ data: null });
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });
  });

  // Effect Hook Testing
  describe("useEffect Behavior", () => {
    it("should re-run auth check when token changes", async () => {
      // Arrange
      const initialAuthState = { user: { id: 1 }, token: "initial-token" };
      const setAuth = jest.fn();
      useAuth.mockReturnValue([initialAuthState, setAuth]);
      mockedAxios.get.mockResolvedValue({ data: { ok: true } });
      
      // Act
      const { rerender } = await act(async () => {
        return render(
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AdminRoute />}>
                <Route index element={<TestComponent />} />
              </Route>
            </Routes>
          </BrowserRouter>
        );
      });
      
      // Update auth state with new token
      const newAuthState = { user: { id: 1 }, token: "new-token" };
      useAuth.mockReturnValue([newAuthState, setAuth]);
      
      await act(async () => {
        rerender(
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AdminRoute />}>
                <Route index element={<TestComponent />} />
              </Route>
            </Routes>
          </BrowserRouter>
        );
      });
      
      // Assert
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });

    it("should not run auth check when token is removed", () => {
      // Arrange
      const authState = { user: null, token: null };
      
      // Act
      renderWithRouter(authState);
      
      // Assert
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  // Outlet Rendering Testing
  describe("Outlet Rendering", () => {
    it("should render Outlet component when authenticated", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockResolvedValue({ data: { ok: true } });
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("admin-content")).toBeInTheDocument();
      });
    });

    it("should not render Outlet component when not authenticated", () => {
      // Arrange
      const authState = { user: null, token: null };
      
      // Act
      renderWithRouter(authState);
      
      // Assert
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });
  });

  // Integration Testing
  describe("Component Integration", () => {
    it("should work correctly with react-router-dom Outlet", async () => {
      // Arrange
      const authState = { user: { id: 1 }, token: "valid-token" };
      mockedAxios.get.mockResolvedValue({ data: { ok: true } });
      
      // Act
      await act(async () => {
        renderWithRouter(authState);
      });
      
      // Assert
      await waitFor(() => {
        const adminContent = screen.getByTestId("admin-content");
        expect(adminContent).toBeInTheDocument();
        expect(adminContent).toHaveTextContent("Admin Content");
      });
    });

    it("should integrate correctly with auth context", () => {
      // Arrange
      const authState = { user: { id: 1, name: "Admin" }, token: "valid-token" };
      mockedAxios.get.mockResolvedValue({ data: { ok: true } });
      
      // Act
      renderWithRouter(authState);
      
      // Assert
      expect(useAuth).toHaveBeenCalled();
    });
  });

  // Performance Testing
  describe("Performance Considerations", () => {
    it("should not make unnecessary API calls", () => {
      // Arrange
      const authState = { user: null, token: null };
      
      // Act
      renderWithRouter(authState);
      renderWithRouter(authState); // Render again
      
      // Assert
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should handle rapid token changes efficiently", async () => {
      // Arrange
      const authState1 = { user: { id: 1 }, token: "token1" };
      const authState2 = { user: { id: 1 }, token: "token2" };
      mockedAxios.get.mockResolvedValue({ data: { ok: true } });
      
      // Act
      const { rerender } = await act(async () => {
        return renderWithRouter(authState1);
      });
      
      useAuth.mockReturnValue([authState2, jest.fn()]);
      
      await act(async () => {
        rerender(
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AdminRoute />}>
                <Route index element={<TestComponent />} />
              </Route>
            </Routes>
          </BrowserRouter>
        );
      });
      
      // Assert
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });
});