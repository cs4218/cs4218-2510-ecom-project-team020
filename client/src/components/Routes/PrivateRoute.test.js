import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  __esModule: true,
  useAuth: jest.fn(() => [{}, jest.fn()]), 
}));

// Mock Spinner to make it assertable and to capture the path prop
jest.mock("../Spinner", () => ({
  __esModule: true,
  default: ({ path }) => <div data-testid="spinner">spinner:{String(path)}</div>,
}));

// eslint-disable-next-line import/first
import { useAuth } from "../../context/auth";
// eslint-disable-next-line import/first
import PrivateRoute from "./PrivateRoute";

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { ok: false } });
    (useAuth).mockImplementation(() => [{}, jest.fn()]);
  });

  const renderWithRoutes = () =>
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/private" element={<div data-testid="private">PRIVATE_CONTENT</div>} />
          </Route>
          {/* optional: public route for contrast */}
          <Route path="/" element={<div>PUBLIC</div>} />
        </Routes>
      </MemoryRouter>
    );

  it("when there is NO auth token: shows Spinner and does not call API", async () => {
    (useAuth).mockReturnValueOnce([{}, jest.fn()]);

    renderWithRoutes();

    // Immediately shows spinner (ok=false initially)
    expect(await screen.findByTestId("spinner")).toHaveTextContent("spinner:");
    // path prop should be an empty string per component
    expect(screen.getByTestId("spinner")).toHaveTextContent("spinner:");

    expect(axios.get).not.toHaveBeenCalled();
    // Content behind Outlet should not be rendered
    expect(screen.queryByTestId("private")).not.toBeInTheDocument();
  });

  it("with token and API ok=true: first shows Spinner, then renders nested route (Outlet)", async () => {
    (useAuth).mockReturnValueOnce([{ token: "t123" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    renderWithRoutes();

    // Initially spinner while effect runs
    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
    // After API resolves ok=true, Outlet should render the child
    await waitFor(() => {
      expect(screen.getByTestId("private")).toHaveTextContent("PRIVATE_CONTENT");
    });

    // Spinner should no longer be present
    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
  });

  it("with token and API ok=false: remains on Spinner (no Outlet)", async () => {
    (useAuth).mockReturnValueOnce([{ token: "t123" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    renderWithRoutes();

    // Spinner should remain since ok stays false
    const sp = await screen.findByTestId("spinner");
    expect(sp).toHaveTextContent("spinner:");

    // No nested content
    expect(screen.queryByTestId("private")).not.toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("Spinner receives an empty string as path prop", async () => {
    (useAuth).mockReturnValueOnce([{}, jest.fn()]);

    renderWithRoutes();

    const sp = await screen.findByTestId("spinner");
    expect(sp).toHaveTextContent("spinner:");
  });

  it("calls API only when a token exists", async () => {
    // First render: no token
    (useAuth).mockReturnValueOnce([{}, jest.fn()]);
    renderWithRoutes();
    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();

    // Re-render scenario: next call to useAuth returns a token
    (useAuth).mockReturnValueOnce([{ token: "t123" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    renderWithRoutes();

    // Spinner first
    expect(await screen.findByTestId("spinner")).toBeInTheDocument();

    // After it resolves ok=true, Outlet/child appears
    await waitFor(() => {
      expect(screen.getByTestId("private")).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
  });

  it("with token: keeps showing Spinner until API resolves (loading behavior)", async () => {
    (useAuth).mockReturnValueOnce([{ token: "t123" }, jest.fn()]);
    // Simulate a pending request by resolving later
    let resolveFn;
    const p = new Promise((res) => (resolveFn = res));
    axios.get.mockReturnValueOnce(p);

    renderWithRoutes();

    // While pending, spinner shows
    expect(await screen.findByTestId("spinner")).toBeInTheDocument();

    // Now resolve with ok=true
    resolveFn({ data: { ok: true } });

    await waitFor(() => {
      expect(screen.getByTestId("private")).toBeInTheDocument();
    });
  });

  it("with token and API rejects: remains on Spinner (no Outlet)", async () => {
    (useAuth).mockReturnValueOnce([{ token: "t123" }, jest.fn()]);
    axios.get.mockImplementationOnce(() => Promise.reject(new Error("Network down")));

    renderWithRoutes();

    // still loading since ok never becomes true
    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("private")).not.toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("with token and API missing ok: remains on Spinner", async () => {
    (useAuth).mockReturnValueOnce([{ token: "t123" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: {} });

    renderWithRoutes();

    const sp = await screen.findByTestId("spinner");
    expect(sp).toBeInTheDocument();
    expect(screen.queryByTestId("private")).not.toBeInTheDocument();
  });

  it("with token: ignores late API response after unmount (covers !active branch)", async () => {
    (useAuth).mockReturnValueOnce([{ token: "t123" }, jest.fn()]);

    let resolveFn;
    const pending = new Promise((res) => (resolveFn = res));
    axios.get.mockReturnValueOnce(pending);

    // render and confirm spinner (still loading)
    const view = renderWithRoutes();
    expect(await screen.findByTestId("spinner")).toBeInTheDocument();

    view.unmount();

    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // now the request resolves (would try to set state if guard wasn't working)
    resolveFn({ data: { ok: true } });

    // let microtasks flush
    await Promise.resolve();

    errSpy.mockRestore();

    // request was made, but no state updates after unmount
    expect(axios.get).toHaveBeenCalledTimes(1);
});

  it("with token: ignores late API rejection after unmount (catch path)", async () => {
    (useAuth).mockReturnValueOnce([{ token: "t123" }, jest.fn()]);

    let rejectFn;
    const pending = new Promise((_, rej) => (rejectFn = rej));
    axios.get.mockReturnValueOnce(pending);

    const view = renderWithRoutes();
    expect(await screen.findByTestId("spinner")).toBeInTheDocument();

    view.unmount();

    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    rejectFn(new Error("late failure"));
    await Promise.resolve();
    errSpy.mockRestore();

    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
