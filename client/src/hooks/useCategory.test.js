/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';

import useCategory from './useCategory';

jest.mock('axios');

describe('useCategory hook', () => {
  const endpoint = '/api/v1/category/get-category';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initially returns an empty array', () => {
    const { result } = renderHook(() => useCategory());
    expect(result.current).toEqual([]);
  });

  it('fetches categories successfully and updates state', async () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Books', slug: 'books' },
    ];
    axios.get.mockResolvedValueOnce({ data: { categories: mockCategories } });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(endpoint);
  });

  it('logs error when API request fails', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      // ensure that state remains unchanged
      expect(result.current).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled(); 
    });

    consoleSpy.mockRestore();
    expect(axios.get).toHaveBeenCalledWith(endpoint);
  });
});
