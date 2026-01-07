import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Car, Trash2, ExternalLink } from 'lucide-react';

interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  created_at: string;
}

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, vin, make, model, year, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Vehicle <span className="gradient-text">History</span>
          </h1>
          <p className="text-muted-foreground">
            View all your previously decoded vehicles
          </p>
        </div>

        {/* Search */}
        <div className="glass-card p-4 mb-6 flex items-center gap-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by VIN, make, or model..."
            className="flex-1 bg-transparent border-none"
          />
        </div>

        {/* Results */}
        {filteredVehicles.length > 0 ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">VIN</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Make</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Model</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Year</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-6 font-mono text-sm text-primary">{vehicle.vin}</td>
                      <td className="py-4 px-6 text-sm">{vehicle.make || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm">{vehicle.model || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm">{vehicle.year || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(vehicle.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/vin-decoder?vin=${vehicle.vin}`)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'No vehicles match your search criteria'
                : "You haven't decoded any vehicles yet"}
            </p>
            <Button variant="hero" onClick={() => navigate('/vin-decoder')}>
              Decode Your First VIN
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
