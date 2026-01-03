# Marine-Axis Admin Panel - API Implementation

## Status: ✅ IMPLEMENTED

### Admin Management API Endpoints

All Admin Management API endpoints have been implemented in `/src/lib/api.ts` and are ready to use.

#### Base URL
- **Production**: `https://marine-axis-be.onrender.com/api/v1`
- **Development**: `http://localhost:3000/api/v1` (via environment variable)

#### Authentication
All endpoints require Bearer token authentication via the `Authorization` header. The token is automatically added by the axios interceptor.

---

## Implemented Endpoints

### 1. List All Admins
```typescript
api.admins.list(params?: {
  page?: number,
  limit?: number,
  role?: 'superadmin' | 'admin',
  isActive?: boolean,
  search?: string
})
```

**Endpoint**: `GET /admins`

**Usage Example**:
```typescript
const response = await api.admins.list({
  page: 1,
  limit: 10,
  role: 'admin',
  isActive: true,
  search: 'john'
});
```

---

### 2. Get Single Admin by ID
```typescript
api.admins.get(id: string)
```

**Endpoint**: `GET /admins/:id`

**Usage Example**:
```typescript
const admin = await api.admins.get('admin-id-123');
```

---

### 3. Create New Admin
```typescript
api.admins.create(data: {
  name: string,
  email: string,
  password: string,
  role: 'superadmin' | 'admin',
  isActive: boolean
})
```

**Endpoint**: `POST /admins`

**Usage Example**:
```typescript
const newAdmin = await api.admins.create({
  name: 'New Admin User',
  email: 'newadmin@marine-axis.com',
  password: 'SecurePassword123',
  role: 'admin',
  isActive: true
});
```

**Permissions**: Requires superadmin authentication

---

### 4. Update Existing Admin
```typescript
api.admins.update(id: string, data: {
  name?: string,
  isActive?: boolean
})
```

**Endpoint**: `PUT /admins/:id`

**Usage Example**:
```typescript
const updated = await api.admins.update('admin-id-123', {
  name: 'Updated Admin Name',
  isActive: false
});
```

**Permissions**: Requires superadmin authentication or self-update

---

### 5. Delete Admin
```typescript
api.admins.delete(id: string)
```

**Endpoint**: `DELETE /admins/:id`

**Usage Example**:
```typescript
await api.admins.delete('admin-id-123');
```

**Permissions**: Requires superadmin authentication

---

### 6. Get Admin Statistics
```typescript
api.admins.getStats()
```

**Endpoint**: `GET /admins/stats`

**Usage Example**:
```typescript
const stats = await api.admins.getStats();
// Returns: { total: number, active: number, byRole: {...} }
```

---

## Error Handling

All API calls automatically handle errors and provide meaningful error messages:

```typescript
try {
  const admins = await api.admins.list();
} catch (error) {
  console.error(error.message); // Predefined error message from server
}
```

**Handled Status Codes**:
- `400`: Validation error
- `401`: Unauthorized - Token refreshed automatically
- `403`: Forbidden - Insufficient permissions
- `404`: Not found
- `500`: Server error

---

## Token Management

The API client automatically:
- ✅ Adds Bearer token to all requests
- ✅ Refreshes expired tokens on 401 response
- ✅ Clears auth on failure and redirects to login
- ✅ Stores tokens in localStorage with keys:
  - `AUTH_TOKEN`
  - `REFRESH_TOKEN`
  - `USER_DATA`

---

## Integration with React Components

### Using with hooks:
```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

function AdminList() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.admins.list({ page: 1, limit: 10 })
      .then(response => setAdmins(response.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    // Your component JSX
  );
}
```

### Using with useCRUD hook:
```typescript
import { useCRUD } from '@/hooks/useCRUD';

function AdminManager() {
  const { data, loading, error, fetch, create, update, delete: deleteItem } = useCRUD('admins');

  // Use the hook methods
  const loadAdmins = () => fetch({ page: 1, limit: 10 });
  const addAdmin = (data) => create(data);
}
```

---

## Implementation Checklist

- [x] Admin list with filters and pagination
- [x] Get single admin by ID
- [x] Create admin
- [x] Update admin
- [x] Delete admin
- [x] Get admin statistics
- [x] Authentication interceptor
- [x] Token refresh mechanism
- [x] Error handling
- [x] Request/response interceptors

---

## Next Steps

Ready to implement remaining API modules:
1. **Provider Management** - Share Postman collection
2. **Job Management** - Share Postman collection
3. **Blog Management** - Share Postman collection
4. **Categories** - Share Postman collection
5. **Approvals** - Share Postman collection
6. **Email Templates** - Share Postman collection
7. **Analytics** - Share Postman collection
8. **Settings** - Share Postman collection
9. **Audit Logs** - Share Postman collection

---

## Testing

To test the API integration:

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Login with valid credentials** to get an auth token

3. **Test any endpoint**:
   ```typescript
   // In browser console
   import { api } from './src/lib/api.js';
   api.admins.list().then(console.log).catch(console.error);
   ```

---

## Environment Variables

To use a custom API URL, create `.env.local`:
```
VITE_API_BASE_URL=https://custom-api.com/api/v1
```

Default fallback: `https://marine-axis-be.onrender.com/api/v1`
