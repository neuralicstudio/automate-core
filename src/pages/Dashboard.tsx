import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Car,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  Camera,
  AlertTriangle,
  MessageSquare,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Mock chart data
const chartData = [
  { date: 'Jan 1', requests: 120 },
  { date: 'Jan 5', requests: 180 },
  { date: 'Jan 10', requests: 250 },
  { date: 'Jan 15', requests: 456 },
  { date: 'Jan 20', requests: 380 },
  { date: 'Jan 25', requests: 420 },
  { date: 'Jan 30', requests: 520 },
];

const aiModules = [
  { icon: Camera, title: 'Damage AI', description: 'AI-powered damage detection', path: '/damage-ai' },
  { icon: AlertTriangle, title: 'Fault Codes', description: 'OBD-II/DTC explainer', path: '/fault-codes' },
  { icon: MessageSquare, title: 'Workshop Assistant', description: 'AI repair chatbot', path: '/workshop-assistant' },
  { icon: Smartphone, title: 'OCR Scanner', description: 'Scan plates & documents', path: '/ocr-scanner' },
];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quickVin, setQuickVin] = useState('');
  const [stats, setStats] = useState({
    totalVins: 0,
    thisMonth: 0,
    successRate: 99.9,
  });
  const [recentVehicles, setRecentVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total vehicles
      const { count: totalCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch this month's lookups
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: monthCount } = await supabase
        .from('vin_lookups')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      // Fetch recent vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalVins: totalCount || 0,
        thisMonth: monthCount || 0,
        successRate: 99.9,
      });
      setRecentVehicles(vehicles || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDecode = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickVin.length === 17) {
      navigate(`/vin-decoder?vin=${quickVin}`);
    }
  };

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
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your automotive intelligence platform.
          </p>
        </div>

        {/* Quick VIN Input */}
        <form onSubmit={handleQuickDecode} className="mb-8">
          <div className="glass-card p-4 flex gap-4 items-center">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              value={quickVin}
              onChange={(e) => setQuickVin(e.target.value.toUpperCase())}
              placeholder="Quick VIN lookup - Enter 17-character VIN"
              className="flex-1 bg-transparent border-none text-lg font-mono"
              maxLength={17}
            />
            <Button type="submit" disabled={quickVin.length !== 17}>
              Decode
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground text-sm">Total VINs Decoded</span>
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats.totalVins.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">All time</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground text-sm">This Month</span>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">
              +{stats.thisMonth}
            </div>
            <div className="text-xs text-muted-foreground mt-1">vs last month</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground text-sm">Success Rate</span>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold">{stats.successRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">API reliability</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground text-sm">Avg Response</span>
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div className="text-3xl font-bold">&lt;100ms</div>
            <div className="text-xs text-muted-foreground mt-1">API latency</div>
          </div>
        </div>

        {/* Chart & Coming Soon */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* API Usage Chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="font-semibold mb-4">API Usage Over Time (Last 30 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 8%)',
                      border: '1px solid hsl(217, 33%, 20%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="hsl(210, 100%, 50%)"
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Tools */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">AI Tools</h3>
            <div className="space-y-3">
              {aiModules.map((module) => (
                <Link
                  key={module.title}
                  to={module.path}
                  className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <module.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{module.title}</div>
                      <div className="text-xs text-muted-foreground">{module.description}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Vehicle Lookups</h3>
            <Link to="/history" className="text-primary text-sm hover:underline">
              View All
            </Link>
          </div>

          {recentVehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">VIN</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Year</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="py-3 px-4 font-mono text-sm text-primary">{vehicle.vin}</td>
                      <td className="py-3 px-4 text-sm">
                        {vehicle.make} {vehicle.model}
                      </td>
                      <td className="py-3 px-4 text-sm">{vehicle.year || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(vehicle.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No vehicles decoded yet</p>
              <Link to="/vin-decoder">
                <Button variant="outline" size="sm" className="mt-4">
                  Decode your first VIN
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
