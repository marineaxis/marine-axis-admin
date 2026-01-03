import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Ship, Star, Plus, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

import api from '../lib/api';

interface Vessel {
  id: string;
  name: string;
  type: string;
  capacity: number;
  location: string;
  pricePerDay: number;
  featured?: boolean;
  createdAt: string;
}

export function VesselsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: vesselsData, isLoading } = useQuery({
    queryKey: ['vessels', searchQuery],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100 };
      if (searchQuery) params.search = searchQuery;
      const response = await api.vessels.list(params);
      return response;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['vessels-stats'],
    queryFn: async () => {
      const response = await api.vessels.getStats();
      return response;
    },
  });

  const vessels = vesselsData?.data || [];
  const stats = statsData?.data || { total: 0, featured: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vessels</h1>
          <p className="text-muted-foreground">Manage vessel listings</p>
        </div>
        <Button onClick={() => navigate('/vessels/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Vessel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Vessels</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Featured</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.featured}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Vessels Management</CardTitle><CardDescription>View and manage all vessels</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vessels..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price/Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : vessels.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">No vessels found</TableCell></TableRow>
                ) : (
                  vessels.map((vessel: Vessel) => (
                    <TableRow key={vessel.id}>
                      <TableCell className="font-medium">{vessel.name}</TableCell>
                      <TableCell><Badge variant="outline">{vessel.type}</Badge></TableCell>
                      <TableCell>{vessel.capacity} guests</TableCell>
                      <TableCell>{vessel.location}</TableCell>
                      <TableCell>${vessel.pricePerDay.toLocaleString()}</TableCell>
                      <TableCell>{vessel.featured && <Badge><Star className="h-3 w-3 mr-1" />Featured</Badge>}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/vessels/${vessel.id}`)}>
                          <Eye className="h-3 w-3 mr-1" />View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VesselsPage;

