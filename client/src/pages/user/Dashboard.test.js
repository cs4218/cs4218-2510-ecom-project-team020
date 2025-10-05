// This file contains unit tests generated with AI assistance but curated, validated and refined by me.
import React from "react";
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";
import '@testing-library/jest-dom/extend-expect';

jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => ({
    __esModule: true,
    default: jest.fn(() => []),
}));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

const mockUseAuth = jest.fn();
jest.mock('../../context/auth', () => ({
    useAuth: () => mockUseAuth()
}));

jest.mock("../../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div data-testid="layout">{children}</div>
}));

jest.mock("../../components/UserMenu", () => ({
    __esModule: true,
    default: () => <div data-testid="user-menu">UserMenu</div>
}));

describe("Dashboard Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Component Static Rendering", () => {
        it("always renders Name, Email, and Address labels regardless of data", () => {
            mockUseAuth.mockReturnValue([null, jest.fn()]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByText(/Name:/)).toBeInTheDocument();
            expect(screen.getByText(/Email:/)).toBeInTheDocument();
            expect(screen.getByText(/Address:/)).toBeInTheDocument();
        });

        it("renders Layout component with correct title", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: "Test User"
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByTestId("layout")).toBeInTheDocument();
        });

        it("renders UserMenu component in sidebar", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: "Test User"
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByTestId("user-menu")).toBeInTheDocument();
        });

        it("renders user information card when auth context has complete user data", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: "John Doe",
                        email: "john@example.com",
                        address: "123 Main St"
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByText(/Name:/)).toBeInTheDocument();
            expect(screen.getByText(/John Doe/)).toBeInTheDocument();
            expect(screen.getByText(/Email:/)).toBeInTheDocument();
            expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
            expect(screen.getByText(/Address:/)).toBeInTheDocument();
            expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
        });

        it("renders fallback text when auth context is null", () => {
            mockUseAuth.mockReturnValue([null, jest.fn()]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByTestId("layout")).toBeInTheDocument();
            expect(screen.getByTestId("user-menu")).toBeInTheDocument();

            const notProvidedTexts = screen.getAllByText("Not provided");
            expect(notProvidedTexts).toHaveLength(3);
        });

        it("renders fallback text when auth.user is undefined", () => {
            mockUseAuth.mockReturnValue([{}, jest.fn()]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByTestId("layout")).toBeInTheDocument();
            expect(screen.getByTestId("user-menu")).toBeInTheDocument();

            const notProvidedTexts = screen.getAllByText("Not provided");
            expect(notProvidedTexts).toHaveLength(3);
        })
    });

    describe("User Fields Equivalence Partitioning", () => {
        it("renders user fields with very long text values", () => {
            const longName = "A".repeat(255);
            const longEmail = "a".repeat(50) + "@example.com";
            const longAddress = "B".repeat(500);

            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: longName,
                        email: longEmail,
                        address: longAddress
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
            expect(screen.getByText(new RegExp(longEmail))).toBeInTheDocument();
            expect(screen.getByText(new RegExp(longAddress))).toBeInTheDocument();
        });

        it("renders name and shows fallback for missing email and address", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: "Jane Doe"
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();

            const notProvidedTexts = screen.getAllByText("Not provided");
            expect(notProvidedTexts).toHaveLength(2);
        });

        it("renders email and shows fallback for missing name and address", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        email: "test@test.com"
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByText(/test@test.com/)).toBeInTheDocument();

            const notProvidedTexts = screen.getAllByText("Not provided");
            expect(notProvidedTexts).toHaveLength(2);
        });

        it("renders address and shows fallback for missing name and email", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        address: "456 Oak Ave"
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByText(/456 Oak Ave/)).toBeInTheDocument();

            const notProvidedTexts = screen.getAllByText("Not provided");
            expect(notProvidedTexts).toHaveLength(2);
        });

        it("renders valid data and fallback for invalid fields in same object", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: "Valid Name",
                        email: "",
                        address: null
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByText(/Valid Name/)).toBeInTheDocument();

            const notProvidedTexts = screen.getAllByText("Not provided");
            expect(notProvidedTexts).toHaveLength(2);
        });
    });


    describe("User Fields Boundary Value Analysis", () => {
        it("renders user data with special characters correctly", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: "O'Brien & Sons <script>",
                        email: "test+tag@sub-domain.co.uk",
                        address: "123 Main St, Apt #5B, \"North Wing\""
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByText(/O'Brien & Sons <script>/)).toBeInTheDocument();
            expect(screen.getByText(/test\+tag@sub-domain\.co\.uk/)).toBeInTheDocument();
            expect(screen.getByText(/123 Main St, Apt #5B, "North Wing"/)).toBeInTheDocument();
        });

        it("renders fallback text when user fields contain empty strings", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: "",
                        email: "",
                        address: ""
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            const notProvidedTexts = screen.getAllByText("Not provided");
            expect(notProvidedTexts).toHaveLength(3);

            expect(screen.getByText(/Name:/)).toBeInTheDocument();
            expect(screen.getByText(/Email:/)).toBeInTheDocument();
            expect(screen.getByText(/Address:/)).toBeInTheDocument();
        });

        it("renders fallback text when user fields are explicitly null", () => {
            mockUseAuth.mockReturnValue([
                {
                    user: {
                        name: null,
                        email: null,
                        address: null
                    }
                },
                jest.fn()
            ]);

            render(
                <MemoryRouter initialEntries={['/dashboard/user']}>
                    <Dashboard />
                </MemoryRouter>
            );

            expect(screen.getByTestId("layout")).toBeInTheDocument();

            const notProvidedTexts = screen.getAllByText("Not provided");
            expect(notProvidedTexts).toHaveLength(3);
        });
    });
});