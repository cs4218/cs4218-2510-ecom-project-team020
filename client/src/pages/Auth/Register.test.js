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

describe('Register Component', () => {
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

  it('should register the user successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByLabelText('dob'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText('answer'), { target: { value: 'Football' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
  });

  it('should display error message on failed registration', async () => {
    axios.post.mockRejectedValueOnce({ message: 'User already exists' });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByLabelText('dob'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText('answer'), { target: { value: 'Football' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should display backend error message when registration fails (Case 2)', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: 'User already exists' } });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByLabelText('dob'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText('answer'), { target: { value: 'Football' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('User already exists');
  });

  it('should display generic error toast when API throws (Case 3)', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByLabelText('dob'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText('answer'), { target: { value: 'Football' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should render all input fields and update their values (EP)', () => {
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
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');

    const phoneInput = screen.getByLabelText('phone');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });
    expect(phoneInput).toHaveValue('9999999999');

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
