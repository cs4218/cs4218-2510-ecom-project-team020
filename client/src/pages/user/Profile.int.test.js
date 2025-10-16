import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import toast from 'react-hot-toast';
import Profile from '../../pages/user/Profile';
import { AuthContext } from '../../context/auth';

// Mock toast to isolate UI
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../components/Header', () => {
  return function MockedHeader() {
    return <div data-testid="mocked-header">Header</div>;
  };
});

// Mock UserMenu and Layout (non-critical UI)
jest.mock('../../components/UserMenu', () => () => <div>UserMenuMock</div>);
jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);

const server = setupServer(
  // ✅ Successful update
  rest.put('/api/v1/auth/profile', async (req, res, ctx) => {
    const body = await req.json();
    if (body.name === 'Error User') {
      return res(ctx.status(400), ctx.json({ error: 'Invalid update request' }));
    }
    return res(
      ctx.status(200),
      ctx.json({
        updatedUser: {
          ...body,
          _id: '123',
          email: 'test@example.com',
        },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

// Mock localStorage
beforeEach(() => {
  Storage.prototype.getItem = jest.fn(() =>
    JSON.stringify({ token: 'mock-token', user: { name: 'John', email: 'test@example.com', phone: '98765432', address: 'Old St' } })
  );
  Storage.prototype.setItem = jest.fn();
});

const renderWithAuth = (authUser) => {
  const mockSetAuth = jest.fn();
  render(
    <AuthContext.Provider value={[{ user: authUser }, mockSetAuth]}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return { mockSetAuth };
};

describe('Profile Integration Tests (MSW)', () => {

  it('loads and populates initial user info', async () => {
    renderWithAuth({
      name: 'John',
      email: 'test@example.com',
      phone: '98765432',
      address: 'Old St',
    });

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('98765432')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old St')).toBeInTheDocument();
  });

  it('updates profile successfully (integration with backend + toast + localStorage)', async () => {
    const { mockSetAuth } = renderWithAuth({
      name: 'John',
      email: 'test@example.com',
      phone: '98765432',
      address: 'Old St',
    });

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'New Road' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully'));
    expect(mockSetAuth).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('handles backend validation error gracefully', async () => {
    renderWithAuth({
      name: 'John',
      email: 'test@example.com',
      phone: '98765432',
      address: 'Old St',
    });

    // Trigger MSW error handler
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Error User' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Invalid update request')
    );
  });

  it('shows form validation error and prevents submission', async () => {
    renderWithAuth({
      name: 'John',
      email: 'test@example.com',
      phone: '98765432',
      address: 'Old St',
    });

    // Invalid phone and password
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Please fix the errors before submitting')
    );
    expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/8–15 digits only/i)).toBeInTheDocument();
  });

  it('handles unexpected network/server failure', async () => {
    server.use(
      rest.put('/api/v1/auth/profile', (req, res, ctx) =>
        res.networkError('Failed to connect')
      )
    );

    renderWithAuth({
      name: 'John',
      email: 'test@example.com',
      phone: '98765432',
      address: 'Old St',
    });

    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong'));
  });
});
