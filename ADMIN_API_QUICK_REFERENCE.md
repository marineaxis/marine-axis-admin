# Admin Management API - Quick Reference

## Installation & Setup

The API client is already configured and ready to use at:
```typescript
import { api } from '@/lib/api';
```

## Quick Examples

### List Admins
```typescript
// List all admins with pagination
const response = await api.admins.list({
  page: 1,
  limit: 10,
  role: 'admin',
  isActive: true,
  search: 'john'
});

console.log(response.data); // Array of admins
console.log(response.pagination); // { page, limit, total, pages }
```

### Get Single Admin
```typescript
const admin = await api.admins.get('admin-123');
console.log(admin.data); // Admin object with id, name, email, role, etc.
```

### Create Admin
```typescript
const newAdmin = await api.admins.create({
  name: 'John Doe',
  email: 'john@marine-axis.com',
  password: 'SecurePassword123',
  role: 'admin',
  isActive: true
});

console.log(newAdmin.data); // Created admin with id
```

### Update Admin
```typescript
const updated = await api.admins.update('admin-123', {
  name: 'Jane Doe',
  isActive: false
});

console.log(updated.data); // Updated admin object
```

### Delete Admin
```typescript
await api.admins.delete('admin-123');
// Returns success response
```

### Get Statistics
```typescript
const stats = await api.admins.getStats();
console.log(stats.data); // { total, active, byRole: {...} }
```

## Integration with React Component

### Example: AdminList Component
```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function AdminList() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.admins.list({
        page: 1,
        limit: 10,
        isActive: true
      });
      setAdmins(response.data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {admins.map(admin => (
        <div key={admin.id}>
          <h3>{admin.name}</h3>
          <p>{admin.email}</p>
          <p>Role: {admin.role}</p>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

```typescript
try {
  const admins = await api.admins.list();
} catch (error) {
  // Predefined error messages:
  // "Network error"
  // "Invalid request"
  // "Unauthorized"
  // "Forbidden"
  // "Not found"
  // "Server error"
  // "An error occurred"
  
  console.error(error.message);
}
```

## Response Format

All responses follow this structure:
```typescript
{
  success: boolean,
  data: T, // Your data
  message?: string,
  pagination?: { // For list endpoints
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

## Key Features

✅ **Automatic Authentication** - Bearer token added to all requests  
✅ **Token Refresh** - Automatically refreshes expired tokens  
✅ **Error Handling** - Consistent error messages  
✅ **Pagination Support** - Built-in pagination helpers  
✅ **Type Safe** - Full TypeScript support  
✅ **Request/Response Interceptors** - Centralized request/response handling

---

Ready to use! Share the next API collection when ready.
