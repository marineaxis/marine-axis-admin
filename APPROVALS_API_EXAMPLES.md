# Approvals API - Code Examples

## React Component Examples

### Example 1: Simple Approvals List

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function ApprovalsList() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.approvals.getPending({
        page: 1,
        limit: 10
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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {approvals.map(approval => (
        <div key={approval.id}>
          <h3>{approval.type}</h3>
          <p>Status: {approval.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Approval Detail with Actions

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function ApprovalDetailPage() {
  const { id } = useParams();
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApproval();
  }, [id]);

  const loadApproval = async () => {
    try {
      setLoading(true);
      const response = await api.approvals.get(id);
      setApproval(response.data);
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

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await api.approvals.approve(id);
      toast({
        title: 'Success',
        description: 'Approval request approved successfully'
      });
      loadApproval();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a rejection reason'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.approvals.reject(id, rejectReason);
      toast({
        title: 'Success',
        description: 'Approval request rejected'
      });
      setShowRejectForm(false);
      setRejectReason('');
      loadApproval();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!approval) return <div>Approval not found</div>;

  return (
    <div>
      <h1>Approval Request: {approval.id}</h1>
      <p>Type: {approval.type}</p>
      <p>Status: {approval.status}</p>
      <p>Requested By: {approval.requestedBy}</p>

      {approval.status === 'pending' && (
        <div>
          <button 
            onClick={handleApprove} 
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Approve'}
          </button>

          {!showRejectForm ? (
            <button onClick={() => setShowRejectForm(true)}>
              Reject
            </button>
          ) : (
            <div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
              />
              <button 
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setShowRejectForm(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Example 3: Approvals Dashboard with Statistics

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function ApprovalsDashboard() {
  const [stats, setStats] = useState(null);
  const [approvalsByType, setApprovalsByType] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsResponse = await api.approvals.getStats();
      setStats(statsResponse.data);

      // Load approvals by type
      const types = ['provider', 'document', 'listing'];
      const byType = {};

      for (const type of types) {
        const response = await api.approvals.getPending({ 
          type,
          limit: 5 
        });
        byType[type] = response.data;
      }

      setApprovalsByType(byType);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div>
      <h1>Approvals Dashboard</h1>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <p className="stat-number">{stats.approved}</p>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <p className="stat-number">{stats.rejected}</p>
        </div>
      </div>

      <div className="approvals-by-type">
        <h2>By Type</h2>
        
        {['provider', 'document', 'listing'].map(type => (
          <div key={type}>
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            <p>Count: {stats.byType?.[type] || 0}</p>
            
            <div className="recent-list">
              {approvalsByType[type]?.slice(0, 3).map(approval => (
                <div key={approval.id} className="approval-item">
                  <p>ID: {approval.id}</p>
                  <p>Status: {approval.status}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={loadDashboardData}>Refresh</button>
    </div>
  );
}
```

### Example 4: Filtered Approvals List

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function FilteredApprovalsList() {
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('provider');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, [filter, page]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.approvals.getPending({
        type: filter,
        page,
        limit: 10
      });
      setApprovals(response.data || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Approvals</h1>

      <div className="filter-bar">
        <select value={filter} onChange={(e) => {
          setFilter(e.target.value);
          setPage(1);
        }}>
          <option value="">All Types</option>
          <option value="provider">Providers</option>
          <option value="document">Documents</option>
          <option value="listing">Listings</option>
        </select>
      </div>

      {loading && <div>Loading...</div>}

      <div className="approvals-grid">
        {approvals.map(approval => (
          <div key={approval.id} className="approval-card">
            <div className="card-header">
              <h3>{approval.type}</h3>
              <span className={`badge ${approval.status}`}>
                {approval.status}
              </span>
            </div>
            <div className="card-body">
              <p>ID: {approval.id}</p>
              <p>Requested: {new Date(approval.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="card-footer">
              <a href={`/approvals/${approval.id}`}>View Details</a>
            </div>
          </div>
        ))}
      </div>

      {pagination && (
        <div className="pagination">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button 
            disabled={page >= pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### Example 5: Bulk Actions

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function BulkApprovalsActions() {
  const [approvals, setApprovals] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.approvals.getPending({
        page: 1,
        limit: 100
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

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Select at least one approval'
      });
      return;
    }

    try {
      setLoading(true);
      for (const id of selected) {
        await api.approvals.approve(id);
      }
      toast({
        title: 'Success',
        description: `${selected.size} approvals approved`
      });
      setSelected(new Set());
      loadApprovals();
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
      <h1>Bulk Approvals Actions</h1>

      <div className="toolbar">
        <button 
          onClick={handleBulkApprove}
          disabled={selected.size === 0 || loading}
        >
          Approve Selected ({selected.size})
        </button>
      </div>

      <div className="approvals-list">
        {approvals.map(approval => (
          <div key={approval.id} className="approval-row">
            <input
              type="checkbox"
              checked={selected.has(approval.id)}
              onChange={() => toggleSelect(approval.id)}
              disabled={approval.status !== 'pending'}
            />
            <span>{approval.type}</span>
            <span>{approval.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Common Patterns

### Pattern 1: Auto-refresh
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await api.approvals.getPending();
    setApprovals(response.data);
  }, 10000); // Refresh every 10 seconds

  return () => clearInterval(interval);
}, []);
```

### Pattern 2: Error Handling
```typescript
try {
  const result = await api.approvals.approve(id);
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

### Pattern 3: Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  try {
    setLoading(true);
    await api.approvals.approve(id);
  } finally {
    setLoading(false);
  }
};
```

---

All endpoints are ready to use! Integrate these examples into your actual pages.
