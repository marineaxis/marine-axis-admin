// Generic CRUD hook for Marine-Axis Admin Panel
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';
import { ApiResponse, PaginatedResponse, TableFilters } from '../types';
import { SUCCESS_MESSAGES } from '../lib/constants';

interface CRUDConfig<T> {
  resource: string;
  api: {
    list: (params?: any) => Promise<PaginatedResponse<T>>;
    get: (id: string) => Promise<ApiResponse<T>>;
    create: (data: any) => Promise<ApiResponse<T>>;
    update: (id: string, data: any) => Promise<ApiResponse<T>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };
  messages?: {
    created?: string;
    updated?: string;
    deleted?: string;
  };
}

interface CRUDState<T> {
  items: T[];
  item: T | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  filters: TableFilters;
}

interface CRUDActions<T> {
  // Data fetching
  fetchItems: (params?: TableFilters) => Promise<void>;
  fetchItem: (id: string) => Promise<T | null>;
  refreshItems: () => Promise<void>;
  
  // CRUD operations
  createItem: (data: any) => Promise<T | null>;
  updateItem: (id: string, data: any) => Promise<T | null>;
  deleteItem: (id: string) => Promise<boolean>;
  
  // State management
  setFilters: (filters: Partial<TableFilters>) => void;
  resetFilters: () => void;
  setItem: (item: T | null) => void;
  
  // Optimistic updates
  optimisticUpdate: (id: string, data: Partial<T>) => void;
  optimisticDelete: (id: string) => void;
  optimisticCreate: (item: T) => void;
}

export function useCRUD<T extends { id: string }>(
  config: CRUDConfig<T>
): CRUDState<T> & CRUDActions<T> {
  const { resource, api, messages = {} } = config;
  const { toast } = useToast();

  const [state, setState] = useState<CRUDState<T>>({
    items: [],
    item: null,
    pagination: {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    filters: {
      page: 1,
      limit: 25,
      sortOrder: 'desc',
    },
  });

  const updateState = useCallback((updates: Partial<CRUDState<T>>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Data fetching
  const fetchItems = useCallback(async (params?: TableFilters) => {
    try {
      updateState({ loading: true });
      
      const filters = params || { page: 1, limit: 25, sortOrder: 'desc' };
      const response = await api.list(filters);
      
      if (response && response.success !== false) {
        // Handle both direct array and PaginatedResponse structure
        // Backend returns: { success: true, data: { data: [...], pagination: {...} } }
        let items: T[] = [];
        let pagination = {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        };

        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check if response.data has a 'data' property (PaginatedResponse structure)
          if (Array.isArray(response.data.data)) {
            items = response.data.data;
            pagination = response.data.pagination || response.pagination || pagination;
          } else if (Array.isArray(response.data)) {
            items = response.data;
          }
        }

        // Also check for pagination at top level
        if (response.pagination) {
          pagination = response.pagination;
        }
        
        updateState({
          items,
          pagination,
          filters,
        });
      } else if (response && response.success === false) {
        toast({
          title: 'Fetch Error',
          description: response.message || `Failed to fetch ${resource}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error(`Failed to fetch ${resource}:`, error);
      toast({
        title: 'Fetch Error',
        description: error.message || `Failed to fetch ${resource}`,
        variant: 'destructive',
      });
    } finally {
      updateState({ loading: false });
    }
  }, [api, resource, toast, updateState]);

  const fetchItem = useCallback(async (id: string): Promise<T | null> => {
    try {
      const response = await api.get(id);
      
      if (response.success) {
        updateState({ item: response.data });
        return response.data;
      }
      return null;
    } catch (error: any) {
      toast({
        title: 'Fetch Error',
        description: error.message || `Failed to fetch ${resource}`,
        variant: 'destructive',
      });
      return null;
    }
  }, [api, resource, toast, updateState]);

  const refreshItems = useCallback(async () => {
    await fetchItems(state.filters);
  }, [fetchItems, state.filters]);

  // CRUD operations
  const createItem = useCallback(async (data: any): Promise<T | null> => {
    try {
      updateState({ creating: true });
      
      const response = await api.create(data);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: messages.created || SUCCESS_MESSAGES.CREATED,
        });
        
        // Refresh the list to get updated data
        await refreshItems();
        
        return response.data;
      }
      return null;
    } catch (error: any) {
      // Enhanced error message with validation details
      let errorDescription = error.message || `Failed to create ${resource}`;
      
      // If there are detailed validation errors, show them
      if (error.errors) {
        try {
          const errors = typeof error.errors === 'string' ? JSON.parse(error.errors) : error.errors;
          if (Array.isArray(errors) && errors.length > 0) {
            const fieldErrors = errors.map((err: any) => {
              const field = err.path?.join('.') || 'field';
              return `${field}: ${err.message}`;
            });
            errorDescription = `Validation errors: ${fieldErrors.join('; ')}`;
          }
        } catch (parseError) {
          // If parsing fails, use the original message
        }
      }
      
      toast({
        title: 'Create Error',
        description: errorDescription,
        variant: 'destructive',
      });
      return null;
    } finally {
      updateState({ creating: false });
    }
  }, [api, messages.created, refreshItems, resource, toast, updateState]);

  const updateItem = useCallback(async (id: string, data: any): Promise<T | null> => {
    try {
      updateState({ updating: true });
      
      const response = await api.update(id, data);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: messages.updated || SUCCESS_MESSAGES.UPDATED,
        });
        
        // Update the item in the list - ensure id matches (handle both _id and id)
        const updatedItem = response.data;
        const itemId = (updatedItem as any)._id ? String((updatedItem as any)._id) : (updatedItem as any).id || id;
        
        updateState({
          items: state.items.map(item => {
            const currentId = (item as any)._id ? String((item as any)._id) : item.id;
            return currentId === itemId ? updatedItem : item;
          }),
          item: state.item && ((state.item as any)._id ? String((state.item as any)._id) : state.item.id) === itemId ? updatedItem : state.item,
        });
        
        return updatedItem;
      }
      return null;
    } catch (error: any) {
      toast({
        title: 'Update Error',
        description: error.message || `Failed to update ${resource}`,
        variant: 'destructive',
      });
      return null;
    } finally {
      updateState({ updating: false });
    }
  }, [api, messages.updated, resource, state.item, state.items, toast, updateState]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      updateState({ deleting: true });
      
      const response = await api.delete(id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: messages.deleted || SUCCESS_MESSAGES.DELETED,
        });
        
        // Remove the item from the list
        updateState({
          items: state.items.filter(item => item.id !== id),
          item: state.item?.id === id ? null : state.item,
        });
        
        return true;
      }
      return false;
    } catch (error: any) {
      toast({
        title: 'Delete Error',
        description: error.message || `Failed to delete ${resource}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      updateState({ deleting: false });
    }
  }, [api, messages.deleted, resource, state.item, state.items, toast, updateState]);

  // State management
  const setFilters = useCallback((filters: Partial<TableFilters>) => {
    setState(prev => {
      const newFilters = { ...prev.filters, ...filters };
      fetchItems(newFilters);
      return { ...prev, filters: newFilters };
    });
  }, [fetchItems]);

  const resetFilters = useCallback(() => {
    const defaultFilters: TableFilters = {
      page: 1,
      limit: 25,
      sortOrder: 'desc',
    };
    setState(prev => {
      fetchItems(defaultFilters);
      return { ...prev, filters: defaultFilters };
    });
  }, [fetchItems]);

  const setItem = useCallback((item: T | null) => {
    updateState({ item });
  }, [updateState]);

  // Optimistic updates
  const optimisticUpdate = useCallback((id: string, data: Partial<T>) => {
    updateState({
      items: state.items.map(item => 
        item.id === id ? { ...item, ...data } : item
      ),
      item: state.item?.id === id ? { ...state.item, ...data } : state.item,
    });
  }, [state.item, state.items, updateState]);

  const optimisticDelete = useCallback((id: string) => {
    updateState({
      items: state.items.filter(item => item.id !== id),
      item: state.item?.id === id ? null : state.item,
    });
  }, [state.item, state.items, updateState]);

  const optimisticCreate = useCallback((item: T) => {
    updateState({
      items: [item, ...state.items],
    });
  }, [state.items, updateState]);

  return {
    // State
    ...state,
    
    // Actions
    fetchItems,
    fetchItem,
    refreshItems,
    createItem,
    updateItem,
    deleteItem,
    setFilters,
    resetFilters,
    setItem,
    optimisticUpdate,
    optimisticDelete,
    optimisticCreate,
  };
}

export default useCRUD;