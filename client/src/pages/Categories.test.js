import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Categories from './Categories';

// mock useCategory hook
jest.mock('../hooks/useCategory');
import useCategory from '../hooks/useCategory';

// mock Layout
jest.mock('../components/Layout', () => {
  return function Layout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

describe('Categories Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with fallback message when no categories are available', () => {
    useCategory.mockReturnValueOnce([]);

    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(getByTestId('layout')).toBeInTheDocument();
    expect(getByText('No categories found!')).toBeInTheDocument();
  });

  it('renders list of categories as links', async () => {
    const mockCategories = [
      { _id: '1', name: 'Phones', slug: 'phones' },
      { _id: '2', name: 'Laptops', slug: 'laptops' },
    ];

    useCategory.mockReturnValueOnce(mockCategories);

    const { getByText, container } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Phones')).toBeInTheDocument();
      expect(getByText('Laptops')).toBeInTheDocument();
    });

    const links = container.querySelectorAll('a.btn.btn-primary');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/category/phones');
    expect(links[1]).toHaveAttribute('href', '/category/laptops');
  });

  it('handles special characters in category names and slugs', async () => {
    const mockCategories = [
      { _id: '99', name: 'Café ☕', slug: 'cafe-☕' }
    ];

    useCategory.mockReturnValueOnce(mockCategories);

    const { getByText } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Café ☕')).toBeInTheDocument();
    });
  });

  it('applies proper Bootstrap classes for grid layout', () => {
    const mockCategories = [
      { _id: '1', name: 'Category A', slug: 'cat-a' }
    ];

    useCategory.mockReturnValueOnce(mockCategories);

    const { container } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(container.querySelector('.container')).toBeInTheDocument();
    expect(container.querySelector('.row')).toBeInTheDocument();
    expect(container.querySelector('.col-md-6.mt-5.mb-3.gx-3.gy-3')).toBeInTheDocument();
  });
});
