# Admin API Usage Examples

## In React Components

### Example 1: Simple Admin List Component

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function AdminListExample() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.admins.list({
        page: 1,
        limit: 10
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

  return (
    <div>
      {loading && <p>Loading...</p>}
      {admins.map(admin => (
        <div key={admin.id}>
          <h3>{admin.name}</h3>
          <p>{admin.email}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Create Admin Form

```typescript
import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateAdminForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.admins.create({
        ...formData,
        isActive: true
      });
      
      toast({
        title: 'Success',
        description: 'Admin created successfully'
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin'
      });
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

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="text"
        name="name"
        placeholder="Admin Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <Input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <Input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
      >
        <option value="admin">Admin</option>
        <option value="superadmin">Super Admin</option>
      </select>
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Admin'}
      </Button>
    </form>
  );
}
```

### Example 3: Admin Detail & Update

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function AdminDetailPage() {
  const { id } = useParams();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAdmin();
  }, [id]);

  const loadAdmin = async () => {
    try {
      setLoading(true);
      const response = await api.admins.get(id);
      setAdmin(response.data);
      setFormData({
        name: response.data.name,
        isActive: response.data.isActive
      });
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

  const handleUpdate = async () => {
    try {
      await api.admins.update(id, formData);
      setAdmin(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Admin updated successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this admin?')) {
      try {
        await api.admins.delete(id);
        toast({
          title: 'Success',
          description: 'Admin deleted successfully'
        });
        // Navigate back to list
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message
        });
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!admin) return <p>Admin not found</p>;

  return (
    <div>
      <h1>{admin.name}</h1>
      <p>Email: {admin.email}</p>
      <p>Role: {admin.role}</p>
      <p>Status: {admin.isActive ? 'Active' : 'Inactive'}</p>

      {isEditing ? (
        <div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
            />
            Active
          </label>
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete} style={{color: 'red'}}>Delete</button>
        </div>
      )}
    </div>
  );
}
```

### Example 4: Using with Custom Hook (useCRUD)

```typescript
import { useCRUD } from '@/hooks/useCRUD';

export function AdminListWithHook() {
  const { 
    data: admins, 
    loading, 
    error, 
    fetch,
    create,
    update,
    delete: deleteAdmin
  } = useCRUD('admins');

  useEffect(() => {
    fetch({ page: 1, limit: 10 });
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      
      {admins.map(admin => (
        <AdminRow
          key={admin.id}
          admin={admin}
          onUpdate={(data) => update(admin.id, data)}
          onDelete={() => deleteAdmin(admin.id)}
        />
      ))}
    </div>
  );
}
```

### Example 5: Admin Statistics

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function AdminStatsWidget() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.admins.getStats()
      .then(response => setStats(response.data))
      .catch(console.error);
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div>
      <h3>Admin Statistics</h3>
      <p>Total Admins: {stats.total}</p>
      <p>Active Admins: {stats.active}</p>
      <p>Superadmins: {stats.byRole?.superadmin || 0}</p>
      <p>Admins: {stats.byRole?.admin || 0}</p>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: List with Filters

```typescript
const [filters, setFilters] = useState({
  page: 1,
  limit: 10,
  role: 'admin',
  isActive: true
});

const loadAdmins = async () => {
  const response = await api.admins.list(filters);
  setAdmins(response.data);
};
```

### Pattern 2: Search

```typescript
const handleSearch = async (searchTerm) => {
  const response = await api.admins.list({
    search: searchTerm,
    page: 1,
    limit: 10
  });
  setAdmins(response.data);
};
```

### Pattern 3: Pagination

```typescript
const handlePageChange = async (newPage) => {
  const response = await api.admins.list({
    page: newPage,
    limit: 10
  });
  setAdmins(response.data);
};
```

### Pattern 4: Filtering by Role

```typescript
const handleRoleFilter = async (role) => {
  const response = await api.admins.list({
    role: role,
    page: 1,
    limit: 10
  });
  setAdmins(response.data);
};
```

---

## Error Handling Best Practices

```typescript
try {
  const response = await api.admins.list();
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    // Redirect to login
  } else if (error.message.includes('Forbidden')) {
    // Show permission denied
  } else {
    // Show generic error
  }
}
```

---

All endpoints are ready to use! Integrate these examples into your actual pages.
