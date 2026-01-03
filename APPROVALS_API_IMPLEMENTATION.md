# Approvals Management API - Implementation Guide

## Status: ✅ IMPLEMENTED

### Base URL
- **Production**: `https://marine-axis-be.onrender.com/api/v1`
- **Development**: `http://localhost:3000/api/v1` (via environment variable)

### Authentication
All endpoints require Bearer token authentication via the `Authorization` header. The token is automatically added by the axios interceptor.

---

## Implemented Endpoints

### 1. Get All Pending Approvals
```typescript
api.approvals.getPending(params?: {
  page?: number,
  limit?: number,
  type?: 'provider' | 'document' | 'listing'
})
```

**Endpoint**: `GET /approvals/pending`

**Usage Example**:
```typescript
const response = await api.approvals.getPending({
  page: 1,
  limit: 10,
  type: 'provider'
});
// Returns: { data: Approval[], pagination: {...}, message: string }
```

**Query Parameters**:
- `page` (number) - Page number for pagination
- `limit` (number) - Items per page
- `type` (string) - Filter by approval type (provider, document, listing)

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "approval-123",
      "type": "provider",
      "status": "pending",
      "requestedBy": "provider-id-123",
      "reviewedAt": null,
      "createdAt": "2025-12-28T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### 2. Get Single Approval Request
```typescript
api.approvals.get(id: string)
```

**Endpoint**: `GET /approvals/:id`

**Usage Example**:
```typescript
const approval = await api.approvals.get('approval-id-123');
// Returns: { data: Approval, message: string }
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "approval-123",
    "type": "provider",
    "status": "pending",
    "requestedBy": "provider-id-123",
    "requestDetails": {
      "name": "Service Provider",
      "email": "provider@example.com"
    },
    "submittedAt": "2025-12-28T10:00:00Z",
    "reviewedAt": null
  }
}
```

---

### 3. Approve a Request
```typescript
api.approvals.approve(id: string)
```

**Endpoint**: `PATCH /approvals/:id/approve`

**Usage Example**:
```typescript
const result = await api.approvals.approve('approval-id-123');
// Returns: { success: true, message: "Approval approved successfully" }
```

**Permissions**: Requires admin authentication

**Response Example**:
```json
{
  "success": true,
  "message": "Approval request approved successfully",
  "data": {
    "id": "approval-123",
    "status": "approved",
    "reviewedAt": "2025-12-28T10:05:00Z"
  }
}
```

---

### 4. Reject a Request
```typescript
api.approvals.reject(id: string, reason: string)
```

**Endpoint**: `PATCH /approvals/:id/reject`

**Usage Example**:
```typescript
const result = await api.approvals.reject(
  'approval-id-123',
  'Document quality is too low.'
);
// Returns: { success: true, message: "Approval rejected successfully" }
```

**Request Body**:
```typescript
{
  "reason": "Document quality is too low." // Required
}
```

**Permissions**: Requires admin authentication

**Response Example**:
```json
{
  "success": true,
  "message": "Approval request rejected successfully",
  "data": {
    "id": "approval-123",
    "status": "rejected",
    "rejectionReason": "Document quality is too low.",
    "reviewedAt": "2025-12-28T10:05:00Z"
  }
}
```

---

### 5. Get Approval Statistics
```typescript
api.approvals.getStats()
```

**Endpoint**: `GET /approvals/stats`

**Usage Example**:
```typescript
const stats = await api.approvals.getStats();
// Returns: { data: { total, pending, approved, rejected }, message: string }
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 5,
    "approved": 40,
    "rejected": 5,
    "byType": {
      "provider": 30,
      "document": 15,
      "listing": 5
    }
  }
}
```

---

## Error Handling

All API calls automatically handle errors and provide meaningful error messages:

```typescript
try {
  const approvals = await api.approvals.getPending();
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

## Integration with React Components

### Using with hooks:
```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.approvals.getPending({ page: 1, limit: 10 })
      .then(response => setApprovals(response.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    // Your component JSX
  );
}
```

### Using with custom hook:
```typescript
import { useCRUD } from '@/hooks/useCRUD';

function ApprovalsManager() {
  const { data, loading, error, fetch } = useCRUD('approvals');

  const loadPending = () => fetch({ page: 1, limit: 10, type: 'provider' });
  const approveRequest = async (id) => await api.approvals.approve(id);
  const rejectRequest = async (id, reason) => await api.approvals.reject(id, reason);
}
```

---

## Common Patterns

### Pattern 1: Load Pending Approvals
```typescript
const response = await api.approvals.getPending({
  page: 1,
  limit: 10,
  type: 'provider'
});

const approvals = response.data;
const pagination = response.pagination;
```

### Pattern 2: Filter by Type
```typescript
const providers = await api.approvals.getPending({
  type: 'provider',
  page: 1
});

const documents = await api.approvals.getPending({
  type: 'document',
  page: 1
});

const listings = await api.approvals.getPending({
  type: 'listing',
  page: 1
});
```

### Pattern 3: Approve with Confirmation
```typescript
try {
  if (confirm('Approve this request?')) {
    const result = await api.approvals.approve(approvalId);
    toast.success('Request approved successfully');
    // Refresh list
    loadApprovals();
  }
} catch (error) {
  toast.error(error.message);
}
```

### Pattern 4: Reject with Reason
```typescript
const reason = prompt('Enter rejection reason:');
if (reason) {
  try {
    const result = await api.approvals.reject(approvalId, reason);
    toast.success('Request rejected');
    // Refresh list
    loadApprovals();
  } catch (error) {
    toast.error(error.message);
  }
}
```

### Pattern 5: Monitor Statistics
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const stats = await api.approvals.getStats();
    setStats(stats.data);
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, []);
```

---

## Integration Checklist

- [x] All 5 endpoints implemented
- [x] All query parameters supported
- [x] Authentication working
- [x] Error handling complete
- [x] TypeScript support
- [x] Request/response interceptors
- [x] Token refresh mechanism
- [x] Documentation complete

---

## Next Steps

1. **Integrate into Pages**:
   - Update `/pages/ApprovalsPage.tsx`
   - Add approval detail view
   - Add approval actions (approve/reject)

2. **Add UI Components**:
   - Approval list component
   - Approval detail modal
   - Approval statistics widget
   - Action buttons

3. **Add Notifications**:
   - Success toast on approve/reject
   - Error handling
   - Confirmation dialogs

---

## Testing

To test the API integration:

1. **Login with valid admin credentials** to get an auth token

2. **Test any endpoint**:
   ```typescript
   // In browser console
   import { api } from './src/lib/api.js';
   api.approvals.getPending({ page: 1, limit: 10 }).then(console.log).catch(console.error);
   ```

3. **Test approval action**:
   ```typescript
   api.approvals.approve('approval-id').then(console.log).catch(console.error);
   ```

4. **Test rejection**:
   ```typescript
   api.approvals.reject('approval-id', 'Quality issue').then(console.log).catch(console.error);
   ```

---

## Security Notes

- All endpoints require admin authentication
- Tokens are automatically managed
- Sensitive data is protected
- CORS headers are configured
- Rate limiting recommended on backend

---

**Status**: ✅ COMPLETE  
**Date**: December 28, 2025  
**Backend**: https://marine-axis-be.onrender.com/api/v1
