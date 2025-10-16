import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { useAuth } from '../../context/auth';

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

jest.mock('../../components/UserMenu', () => () => <div data-testid="user-menu">UserMenu</div>);
jest.mock('../../components/Layout', () => ({ title, children }) => (
    <div data-testid="layout">
        <h1>{title}</h1>
        {children}
    </div>
));

describe('Dashboard Integration Tests', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders user info correctly when Auth context has data', () => {
        useAuth.mockReturnValue([
            {
                user: {
                    name: 'Alice',
                    email: 'alice@example.com',
                    address: '123 Wonderland',
                },
            },
        ]);

        render(<Dashboard />);

        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('user-menu')).toBeInTheDocument();

        expect(screen.getByRole('heading', { name: /Name:/i })).toHaveTextContent('Alice');
        expect(screen.getByRole('heading', { name: /Email:/i })).toHaveTextContent('alice@example.com');
        expect(screen.getByRole('heading', { name: /Address:/i })).toHaveTextContent('123 Wonderland');
    });

    it('renders "Not provided" for missing user fields', () => {
        useAuth.mockReturnValue([{ user: {} }]);

        render(<Dashboard />);

        expect(screen.getByRole('heading', { name: /Name:/i })).toHaveTextContent('Not provided');
        expect(screen.getByRole('heading', { name: /Email:/i })).toHaveTextContent('Not provided');
        expect(screen.getByRole('heading', { name: /Address:/i })).toHaveTextContent('Not provided');
    });

    it('renders gracefully even if Auth context is null', () => {
        useAuth.mockReturnValue([null]);

        render(<Dashboard />);

        expect(screen.getByRole('heading', { name: /Name:/i })).toHaveTextContent('Not provided');
        expect(screen.getByRole('heading', { name: /Email:/i })).toHaveTextContent('Not provided');
        expect(screen.getByRole('heading', { name: /Address:/i })).toHaveTextContent('Not provided');
    });
});
