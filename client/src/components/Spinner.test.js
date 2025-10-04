import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Spinner from "./Spinner";

// Mock React Router hooks
const mockNavigate = jest.fn();
const mockLocation = { pathname: "/current-path" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const renderSpinner = (path = "login") => {
  return render(
    <MemoryRouter>
      <Spinner path={path} />
    </MemoryRouter>
  );
};

describe("Spinner Component - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Initial Rendering", () => {
    it("should render spinner component without crashing", () => {
      renderSpinner();

      expect(
        screen.getByText(/redirecting to you in \d+ second/)
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should display initial countdown value of 3", () => {
      renderSpinner();

      expect(
        screen.getByText("redirecting to you in 3 second")
      ).toBeInTheDocument();
    });

    it("should render loading spinner with correct attributes", () => {
      renderSpinner();

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("spinner-border");

      const hiddenText = screen.getByText("Loading...");
      expect(hiddenText).toHaveClass("visually-hidden");
    });

    it("should apply correct container styling", () => {
      renderSpinner();

      // Test that the spinner elements are rendered correctly
      expect(
        screen.getByText(/redirecting to you in \d+ second/)
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Countdown Timer Behavior", () => {
    it("should decrement count from 3 to 2 after 1 second", async () => {
      renderSpinner();

      expect(
        screen.getByText("redirecting to you in 3 second")
      ).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(
        screen.getByText("redirecting to you in 2 second")
      ).toBeInTheDocument();
    });

    it("should decrement count from 2 to 1 after another second", async () => {
      renderSpinner();

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(
        screen.getByText("redirecting to you in 1 second")
      ).toBeInTheDocument();
    });

    it("should handle count reaching 0", async () => {
      renderSpinner();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: "/current-path",
      });
    });
  });

  describe("Navigation Integration", () => {
    it("should call navigate with default login path", async () => {
      renderSpinner();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: "/current-path",
      });
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("should call navigate with custom path when provided", async () => {
      renderSpinner("dashboard");

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        state: "/current-path",
      });
    });

    it("should pass current location pathname as state", async () => {
      renderSpinner();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: "/current-path",
      });
    });
  });

  describe("Equivalence Partitioning", () => {
    describe("Valid Path Parameters", () => {
      it("should handle valid string paths", async () => {
        const validPaths = ["login", "dashboard", "home", "profile"];

        for (const path of validPaths) {
          jest.clearAllMocks();
          renderSpinner(path);

          act(() => {
            jest.advanceTimersByTime(3000);
          });

          expect(mockNavigate).toHaveBeenCalledWith(`/${path}`, {
            state: "/current-path",
          });
        }
      });

      it("should handle undefined path (default case)", async () => {
        renderSpinner(undefined);

        act(() => {
          jest.advanceTimersByTime(3000);
        });

        expect(mockNavigate).toHaveBeenCalledWith("/login", {
          state: "/current-path",
        });
      });
    });

    describe("Invalid Path Parameters", () => {
      it("should handle empty string path", async () => {
        renderSpinner("");

        act(() => {
          jest.advanceTimersByTime(3000);
        });

        expect(mockNavigate).toHaveBeenCalledWith("/", {
          state: "/current-path",
        });
      });
    });
  });
});
