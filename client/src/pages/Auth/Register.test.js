// This file contains unit tests generated with AI assistance but curated, validated and refined by me.
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

jest.mock('axios');
jest.mock('react-hot-toast');

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

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register Component', () => {
  describe('Component Static Rendering', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      axios.get.mockResolvedValue({ data: { category: [] } });
    });

    beforeAll(() => {
      jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterAll(() => {
      console.log.mockRestore();
    });

    it('registers the user successfully', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Street' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Football' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith('Registered Successfully, Please Login');
    });

    it('navigates to /login after successful registration', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Street' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Football' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('displays error message on failed registration', async () => {
      axios.post.mockRejectedValueOnce({ message: 'User already exists' });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Street' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Football' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    it('displays backend error message when registration fails', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: false, message: 'User already exists' } });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Street' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Football' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('User already exists');
    });

    it('displays generic error toast upon API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Street' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Football' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    it('renders all input fields and updates their values', () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText('name');
      fireEvent.change(nameInput, { target: { value: 'Alice' } });
      expect(nameInput).toHaveValue('Alice');

      const emailInput = screen.getByLabelText('email');
      fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
      expect(emailInput).toHaveValue('alice@example.com');

      const passwordInput = screen.getByLabelText('password');
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      expect(passwordInput).toHaveValue('Password123!');

      const phoneInput = screen.getByLabelText('phone');
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      expect(phoneInput).toHaveValue('1234567890');

      const addressInput = screen.getByLabelText('address');
      fireEvent.change(addressInput, { target: { value: '123 Street' } });
      expect(addressInput).toHaveValue('123 Street');

      const dobInput = screen.getByLabelText('dob');
      fireEvent.change(dobInput, { target: { value: '1995-05-05' } });
      expect(dobInput).toHaveValue('1995-05-05');

      const answerInput = screen.getByLabelText('answer');
      fireEvent.change(answerInput, { target: { value: 'Football' } });
      expect(answerInput).toHaveValue('Football');
    });
  });

  describe('Empty Field Form Validation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('shows error when all fields are empty', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('REGISTER'));

      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(await screen.findByText('Email is required')).toBeInTheDocument();
      expect(await screen.findByText('Password is required')).toBeInTheDocument();
      expect(await screen.findByText('Phone number is required')).toBeInTheDocument();
      expect(await screen.findByText('Address is required')).toBeInTheDocument();
      expect(await screen.findByText('Date of Birth is required')).toBeInTheDocument();
      expect(await screen.findByText('Security answer is required')).toBeInTheDocument();
    });

    it('shows error when name is empty', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('shows error when email is empty', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('shows error when address is empty', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Address is required')).toBeInTheDocument();
      });
    });

    it('shows error when DOB is empty', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Date of Birth is required')).toBeInTheDocument();
      });
    });

    it('shows error when security answer is empty', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Security answer is required')).toBeInTheDocument();
      });
    });
  });

  describe('Email Validation Equivalence Partitioning', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('shows error for invalid email format with missing @', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalidemail.com' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format with missing domain', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format with missing extension', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('accepts valid email format', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'valid@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Address' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Answer' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument();
    });
  });

  describe('Phone Number Validation Boundary Value Analysis', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('shows error for phone number with less than 8 digits', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '1234567' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Phone number must be 8–15 digits only')).toBeInTheDocument();
      });
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('shows error for phone number with more than 15 digits', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '1234567890123456' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Phone number must be 8–15 digits only')).toBeInTheDocument();
      });
    });

    it('accepts phone number with exactly 8 digits', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Address' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Answer' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(screen.queryByText('Phone number must be 8–15 digits only')).not.toBeInTheDocument();
    });

    it('accepts phone number with exactly 15 digits', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '123456789012345' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Address' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Answer' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(screen.queryByText('Phone number must be 8–15 digits only')).not.toBeInTheDocument();
    });

    it('shows error for phone number with non-numeric characters', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '123abc7890' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText('Phone number must be 8–15 digits only')).toBeInTheDocument();
      });
    });
  });

  describe('Password Validation Equivalence Partitioning', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('shows error for password less than 8 characters', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Pass1!' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument();
      });
    });

    it('shows error for password without uppercase letter', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123!' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument();
      });
    });

    it('shows error for password without special character', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123' }
      });
      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument();
      });
    });

    it('accepts valid password with >= 8 chars, uppercase, and special char', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'ValidPass123!' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Address' } });
      fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Answer' } });

      fireEvent.click(screen.getByText('REGISTER'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(screen.queryByText(/Password must be at least 8 characters/)).not.toBeInTheDocument();
    });
  });
});