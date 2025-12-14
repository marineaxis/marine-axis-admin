// Generic CRUD hook for Marine-Axis Admin Panel
import { useState, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { ApiResponse, PaginatedResponse, TableFilters } from '../types';
import { SUCCESS_MESSAGES } from '../lib/constants';

export interface CRUDConfig<T> {
  resource: string;
  api: {
    list: (params?: TableFilters) => Promise<PaginatedResponse<T>>;
    get: (id: string) => Promise<ApiResponse<T>>;
    create?: (data?: unknown) => Promise<ApiResponse<T>>;
    update?: (id: string, data?: unknown) => Promise<ApiResponse<T>>;
    delete?: (id: string) => Promise<ApiResponse<void>>;
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
  fetchItems: (params?: TableFilters) => Promise<PaginatedResponse<T> | void>;
  fetchItem: (id: string) => Promise<T | null>;
  refreshItems: () => Promise<void>;
  
  // CRUD operations
  createItem: (data?: unknown) => Promise<T | null>;
  updateItem: (id: string, data?: unknown) => Promise<T | null>;
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

  // In-flight fetch dedupe map and short-lived cache
  const inFlightFetchesRef = useRef<Record<string, Promise<PaginatedResponse<T> | void>>>({});
  const lastFetchCacheRef = useRef<{ key: string | null; time: number; resp?: PaginatedResponse<T> | void }>({ key: null, time: 0, resp: undefined });

  // Helper to normalize backend documents that may use `_id`
  const normalizeItem = useCallback((raw: unknown): T => {
    // If value is null/undefined/non-object, cast through - callers expect T and
    // upstream code already guards data from API responses to be objects.
    if (raw === null || raw === undefined || typeof raw !== 'object') {
      return raw as unknown as T;
    }

    const obj = raw as Record<string, unknown>;

    // Prefer an existing `id` string; otherwise coerce `_id` if present
    let id: string | undefined;
    if (typeof obj.id === 'string') {
      id = obj.id;
    } else if (obj._id !== undefined && (typeof obj._id === 'string' || typeof obj._id === 'number')) {
      id = String(obj._id);
    }

    return { ...obj, id } as unknown as T;
  }, []);

  // Data fetching
  const fetchItems = useCallback(async (params?: TableFilters) => {
    try {
      updateState({ loading: true });
      const filters = params || { page: 1, limit: 25, sortOrder: 'desc' };

      // Create a stable key for this filters set
      let key = '';
      try { key = JSON.stringify(filters); } catch (e) { key = String(filters); }

      // short-lived cache: if same key recently fetched, return cached
      const now = Date.now();
      if (lastFetchCacheRef.current.key === key && now - lastFetchCacheRef.current.time < 500 && lastFetchCacheRef.current.resp) {
        return lastFetchCacheRef.current.resp as PaginatedResponse<T>;
      }

      // If there's an in-flight fetch for same key, return that promise
      const existing = inFlightFetchesRef.current[key];
      if (existing) {
        return existing;
      }

      const fetchPromise = (async () => {
        const response = await api.list(filters);

        if (response.success) {
          // Defensive normalization: ensure items is always an array and pagination exists
          const itemsArray = Array.isArray(response.data) ? response.data : (response.data || []);
          // Ensure every item has an `id` property (map _id -> id) to avoid undefined ids in UI
          const normalizedItems = (Array.isArray(itemsArray) ? itemsArray : []).map(item => normalizeItem(item)) as T[];
          const pagination = response.pagination ?? {
            page: filters.page || 1,
            limit: filters.limit || 25,
            total: 0,
            totalPages: 0,
          };

          updateState({
            items: normalizedItems as T[],
            pagination: pagination as CRUDState<T>['pagination'],
            // Do NOT overwrite filters here — that would create a new object identity
            // on every fetch and can trigger upstream effects that watch `filters`.
          });

          // cache response briefly
          lastFetchCacheRef.current = { key, time: Date.now(), resp: response };
        } else {
          toast({ title: 'Fetch Error', description: response.message || `Failed to fetch ${resource}`, variant: 'destructive' });
        }

        // If API returned a dev fallback marker, show a toast in development
        try {
          const raw = response as unknown as Record<string, unknown>;
          if (raw && raw._debugFallback && process.env.NODE_ENV !== 'production') {
            toast({ title: 'Dev fallback', description: 'Using development debug API for this resource', variant: 'default' });
          }
        } catch (e) {
          // noop
        }

        return response;
      })();

      inFlightFetchesRef.current[key] = fetchPromise;
      try {
        const resp = await fetchPromise;
        return resp;
      } finally {
        delete inFlightFetchesRef.current[key];
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to fetch ${resource}`;
      toast({
        title: 'Fetch Error',
        description: message,
        variant: 'destructive',
      });
      return undefined;
    } finally {
      updateState({ loading: false });
    }
  }, [api, resource, toast, updateState, normalizeItem]);

  const fetchItem = useCallback(async (id: string): Promise<T | null> => {
    try {
      const response = await api.get(id);
      
      if (response.success) {
        const normalized = normalizeItem(response.data);
        updateState({ item: normalized });
        return normalized as T;
      }
      return null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to fetch ${resource}`;
      toast({
        title: 'Fetch Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  }, [api, resource, toast, updateState, normalizeItem]);

  const refreshItems = useCallback(async () => {
    await fetchItems(state.filters);
  }, [fetchItems, state.filters]);

  // CRUD operations
  const createItem = useCallback(async (data?: unknown): Promise<T | null> => {
    try {
      updateState({ creating: true });
      
      if (!api.create) {
        toast({ title: 'Not supported', description: `Create not supported for ${resource}`, variant: 'destructive' });
        return null;
      }
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
    } catch (error: unknown) {
      let message = error instanceof Error ? error.message : `Failed to create ${resource}`;
      
      // Handle MongoDB duplicate key error for email
      if (message.includes('E11000') && message.includes('email')) {
        message = 'This email address is already registered. Please use a different email.';
      } else if (message.includes('E11000')) {
        message = 'This record already exists. Please check your input and try again.';
      }
      
      toast({
        title: 'Create Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      updateState({ creating: false });
    }
  }, [api, messages.created, refreshItems, resource, toast, updateState]);

  const updateItem = useCallback(async (id: string, data?: unknown): Promise<T | null> => {
    try {
      updateState({ updating: true });
      
      if (!api.update) {
        toast({ title: 'Not supported', description: `Update not supported for ${resource}`, variant: 'destructive' });
        return null;
      }
      const response = await api.update(id, data);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: messages.updated || SUCCESS_MESSAGES.UPDATED,
        });
        
        // Update the item in the list
        const normalized = normalizeItem(response.data);
        updateState({
          items: state.items.map(item => 
            item.id === id ? normalized : item
          ),
          item: state.item?.id === id ? normalized as T : state.item,
        });
        
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to update ${resource}`;
      toast({
        title: 'Update Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      updateState({ updating: false });
    }
  }, [api, messages.updated, resource, state.item, state.items, toast, updateState, normalizeItem]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      updateState({ deleting: true });
      
      if (!api.delete) {
        toast({ title: 'Not supported', description: `Delete not supported for ${resource}`, variant: 'destructive' });
        return false;
      }
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to delete ${resource}`;
      toast({
        title: 'Delete Error',
        description: message,
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
      return { ...prev, filters: newFilters };
    });
  }, []);

  const resetFilters = useCallback(() => {
    const defaultFilters: TableFilters = { page: 1, limit: 25, sortOrder: 'desc' };
    // Update filters state first, then trigger fetch once to avoid calling fetch during render
    setState(prev => ({ ...prev, filters: defaultFilters }));
    // Fire-and-forget; callers shouldn't await resetFilters
    void fetchItems(defaultFilters);
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