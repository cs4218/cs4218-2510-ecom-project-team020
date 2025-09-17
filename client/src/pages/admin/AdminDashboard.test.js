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

window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
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
});
