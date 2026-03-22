import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage service bookings and reservations</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-6">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-2">Coming Soon</CardTitle>
          <CardDescription className="text-base">
            The Bookings management feature is currently under development.
            <br />
            This section will allow you to view, manage, and track all service bookings.
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>We're working hard to bring this feature to you soon!</span>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
