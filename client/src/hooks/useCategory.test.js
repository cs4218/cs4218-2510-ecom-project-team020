import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';

import useCategory from './useCategory';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('useCategory hook', () => {
  const endpoint = '/api/v1/category/get-category';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initially returns an empty array', () => {
    // Mock to prevent effect completion
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    
    const { result } = renderHook(() => useCategory());
    expect(result.current).toEqual([]);
  });

  it('fetches categories successfully and updates state', async () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Books', slug: 'books' },
    ];
    
    // Setup mock before rendering
    mockedAxios.get.mockResolvedValue({ 
      data: { categories: mockCategories } 
    });

    const { result } = renderHook(() => useCategory());

    // First verify axios was called
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    // Then verify the state updated
    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(endpoint);
  });

  it('logs error when API request fails', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockError = new Error('Server error');
    
    // Setup mock to reject
    mockedAxios.get.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCategory());

    // Wait for axios to be called
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    // Wait for console.log to be called
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
    });

    // Verify state remains empty
    expect(result.current).toEqual([]);
    expect(mockedAxios.get).toHaveBeenCalledWith(endpoint);

    consoleSpy.mockRestore();
  });
});