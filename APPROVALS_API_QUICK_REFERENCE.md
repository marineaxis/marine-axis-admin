# Approvals API - Quick Reference

## Installation & Setup

The API client is already configured and ready to use at:
```typescript
import { api } from '@/lib/api';
```

## Quick Examples

### Get Pending Approvals
```typescript
// Get all pending approvals
const response = await api.approvals.getPending({
  page: 1,
  limit: 10
});

console.log(response.data); // Array of pending approvals
console.log(response.pagination); // { page, limit, total, pages }
```

### Get Pending by Type
```typescript
// Filter by provider type
const providers = await api.approvals.getPending({
  page: 1,
  limit: 10,
  type: 'provider'
});

// Filter by document type
const documents = await api.approvals.getPending({
  type: 'document'
});

// Filter by listing type
const listings = await api.approvals.getPending({
  type: 'listing'
});
```

### Get Single Approval
```typescript
const approval = await api.approvals.get('approval-123');
console.log(approval.data); // Approval object with details
```

### Approve Request
```typescript
const result = await api.approvals.approve('approval-123');
console.log(result.message); // "Approval request approved successfully"
```

### Reject Request
```typescript
const result = await api.approvals.reject(
  'approval-123',
  'Document quality is too low.'
);
console.log(result.message); // "Approval request rejected successfully"
```

### Get Statistics
```typescript
const stats = await api.approvals.getStats();
console.log(stats.data); // { total, pending, approved, rejected, byType }
```

## Integration with React Component

### Example: ApprovalsPage Component
```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadApprovals();
    loadStats();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.approvals.getPending({
        page: 1,
        limit: 10,
        type: 'provider'
      });
      setApprovals(response.data || []);
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

  const loadStats = async () => {
    try {
      const response = await api.approvals.getStats();
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      await api.approvals.approve(approvalId);
      toast({
        title: 'Success',
        description: 'Approval request approved'
      });
      loadApprovals();
      loadStats();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  const handleReject = async (approvalId, reason) => {
    try {
      await api.approvals.reject(approvalId, reason);
      toast({
        title: 'Success',
        description: 'Approval request rejected'
      });
      loadApprovals();
      loadStats();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Approvals Management</h1>
      
      {stats && (
        <div className="stats">
          <p>Total: {stats.total}</p>
          <p>Pending: {stats.pending}</p>
          <p>Approved: {stats.approved}</p>
          <p>Rejected: {stats.rejected}</p>
        </div>
      )}

      <div className="approvals-list">
        {approvals.map(approval => (
          <div key={approval.id} className="approval-item">
            <h3>{approval.type}</h3>
            <p>Status: {approval.status}</p>
            <button onClick={() => handleApprove(approval.id)}>
              Approve
            </button>
            <button onClick={() => {
              const reason = prompt('Enter rejection reason:');
              if (reason) handleReject(approval.id, reason);
            }}>
              Reject
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

```typescript
try {
  const approvals = await api.approvals.getPending();
} catch (error) {
  // Predefined error messages:
  // "Network error"
  // "Invalid request"
  // "Unauthorized"
  // "Forbidden"
  // "Not found"
  // "Server error"
  
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
✅ **Filtering** - Filter by type (provider, document, listing)  
✅ **Type Safe** - Full TypeScript support  
✅ **Request/Response Interceptors** - Centralized request/response handling

---

Ready to use! Integration examples provided.
