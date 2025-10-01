import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';

import useCategory from './useCategory';

jest.mock('axios');
const mockedAxios = axios;

describe('useCategory hook', () => {
  const endpoint = '/api/v1/category/get-category';
  const mockCategories = [
    { _id: '1', name: 'Electronics', slug: 'electronics' },
    { _id: '2', name: 'Books', slug: 'books' },
  ];
  const mockError = new Error('Server error');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('returns an empty array initially', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      
      const { result } = renderHook(() => useCategory());

      expect(result.current).toEqual([]);
    });
  });

  describe('interaction with axios', () => {
    it('calls axios get with correct endpoint', async () => {
      mockedAxios.get.mockResolvedValueOnce({ 
        data: { categories: mockCategories } 
      });

      renderHook(() => useCategory());

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(endpoint);
    });
  });

  describe('success', () => {
    it('returns fetched categories', async () => {
      mockedAxios.get.mockResolvedValueOnce({ 
        data: { categories: mockCategories } 
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toEqual(mockCategories);
      });
    });

    it('handles no categories gracefully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ 
        data: {} 
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });

      expect(result.current).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('logs error to console when API request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(mockError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      renderHook(() => useCategory());

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(mockError);
      });
      consoleSpy.mockRestore();
    });

    it('returns empty array when API request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useCategory());

      expect(result.current).toEqual([]);
    });
  });
});