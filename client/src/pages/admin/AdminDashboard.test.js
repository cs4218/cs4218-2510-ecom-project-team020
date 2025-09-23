import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminDashboard from './AdminDashboard';

const mockAuth = {
    user: {
        name: 'John Admin',
        email: 'admin@example.com',
        phone: '1234567890'
    }
};

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [mockAuth, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../components/AdminMenu', () => {
    return function AdminMenu() {
        return <div data-testid="admin-menu">Admin Menu</div>;
    };
});

jest.mock('./../../components/Layout', () => {
    return function Layout({ children }) {
        return <div data-testid="layout">{children}</div>;
    };
});

Object.defineProperty(window, 'localStorage', {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
});

window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

describe('AdminDashboard Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders admin dashboard correctly', () => {
        const { getByTestId, getByText } = render(
            <MemoryRouter initialEntries={['/dashboard/admin']}>
                <Routes>
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByTestId('layout')).toBeInTheDocument();
        expect(getByTestId('admin-menu')).toBeInTheDocument();
        expect(getByText(`Admin Name : ${mockAuth.user.name}`)).toBeInTheDocument();
        expect(getByText(`Admin Email : ${mockAuth.user.email}`)).toBeInTheDocument();
        expect(getByText(`Admin Contact : ${mockAuth.user.phone}`)).toBeInTheDocument();
    });

    it('displays admin information from auth context', () => {
        const { getByText } = render(
            <MemoryRouter initialEntries={['/dashboard/admin']}>
                <Routes>
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText(`Admin Name : ${mockAuth.user.name}`)).toBeInTheDocument();
        expect(getByText(`Admin Email : ${mockAuth.user.email}`)).toBeInTheDocument();
        expect(getByText(`Admin Contact : ${mockAuth.user.phone}`)).toBeInTheDocument();
    });

    it('renders with proper CSS classes and structure', () => {
        const { container } = render(
            <MemoryRouter initialEntries={['/dashboard/admin']}>
                <Routes>
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Routes>
            </MemoryRouter>
        );

        expect(container.querySelector('.container-fluid.m-3.p-3')).toBeInTheDocument();
        expect(container.querySelector('.row')).toBeInTheDocument();
        expect(container.querySelector('.col-md-3')).toBeInTheDocument();
        expect(container.querySelector('.col-md-9')).toBeInTheDocument();
        expect(container.querySelector('.card.w-75.p-3')).toBeInTheDocument();
    });

    it('handles null auth user gracefully', () => {
        // Override the mock for this specific test
        const { useAuth } = require('../../context/auth');
        useAuth.mockReturnValueOnce([{ user: null }, jest.fn()]);

        const { getByText } = render(
            <MemoryRouter initialEntries={['/dashboard/admin']}>
                <Routes>
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText('Admin Name :')).toBeInTheDocument();
        expect(getByText('Admin Email :')).toBeInTheDocument();
        expect(getByText('Admin Contact :')).toBeInTheDocument();
    });

    it('handles undefined auth gracefully', () => {
        // Override the mock for this specific test
        const { useAuth } = require('../../context/auth');
        useAuth.mockReturnValueOnce([null, jest.fn()]);

        const { getByText } = render(
            <MemoryRouter initialEntries={['/dashboard/admin']}>
                <Routes>
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText('Admin Name :')).toBeInTheDocument();
        expect(getByText('Admin Email :')).toBeInTheDocument();
        expect(getByText('Admin Contact :')).toBeInTheDocument();
    });

    it('handles very long strings without breaking UI layout', () => {
        const veryLongName = 'A'.repeat(500);
        const veryLongEmail = 'verylongemailaddress'.repeat(20) + '@example.com';
        const veryLongPhone = '1234567890'.repeat(50);

        const longDataAuth = {
            user: {
                name: veryLongName,
                email: veryLongEmail,
                phone: veryLongPhone
            }
        };

        const { useAuth } = require('../../context/auth');
        useAuth.mockReturnValueOnce([longDataAuth, jest.fn()]);

        const { container, getByText } = render(
            <MemoryRouter initialEntries={['/dashboard/admin']}>
                <Routes>
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText(`Admin Name : ${veryLongName}`)).toBeInTheDocument();
        expect(getByText(`Admin Email : ${veryLongEmail}`)).toBeInTheDocument();
        expect(getByText(`Admin Contact : ${veryLongPhone}`)).toBeInTheDocument();

        const cardElement = container.querySelector('.card.w-75.p-3');
        expect(cardElement).toBeInTheDocument();
        expect(container.querySelector('.container-fluid')).toBeInTheDocument();
        expect(container.querySelector('.row')).toBeInTheDocument();

        expect(cardElement).toHaveClass('w-75');
    });

    it('handles special characters and unicode without breaking', () => {
        const specialCharAuth = {
            user: {
                name: '名前 🚀 José María ñ ü ß αβγ δεζ ηθι κλμ νξο πρσ τυφ χψω',
                email: 'tëst+tãg@sūb-dömain.cö.uk',
                phone: '+1 (555) 123-4567 ext. 890 📞'
            }
        };

        const { useAuth } = require('../../context/auth');
        useAuth.mockReturnValueOnce([specialCharAuth, jest.fn()]);

        const { getByText, container } = render(
            <MemoryRouter initialEntries={['/dashboard/admin']}>
                <Routes>
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText(`Admin Name : ${specialCharAuth.user.name}`)).toBeInTheDocument();
        expect(getByText(`Admin Email : ${specialCharAuth.user.email}`)).toBeInTheDocument();
        expect(getByText(`Admin Contact : ${specialCharAuth.user.phone}`)).toBeInTheDocument();

        expect(container.innerHTML).toContain('🚀');
        expect(container.innerHTML).toContain('José');
        expect(container.innerHTML).toContain('📞');
    });
});
