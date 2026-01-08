import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Shield,
  Plus,
  Copy,
  Check,
  Trash2,
  Users,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';

interface Passcode {
  id: string;
  passcode: string;
  passcode_used: boolean;
  created_at: string;
}

interface UserStat {
  id: string;
  user_id: string;
  total_uses: number;
  is_premium: boolean;
  premium_uses_remaining: number;
  premium_expires_at: string | null;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [passcodes, setPasscodes] = useState<Passcode[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('AUTO');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin',
      });

      if (error) throw error;

      if (!data) {
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await Promise.all([fetchPasscodes(), fetchUserStats()]);
    } catch (err) {
      console.error('Error checking admin status:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPasscodes = async () => {
    const { data, error } = await supabase
      .from('user_credits')
      .select('id, passcode, passcode_used, created_at')
      .not('passcode', 'is', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPasscodes(data as Passcode[]);
    }
  };

  const fetchUserStats = async () => {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .order('total_uses', { ascending: false })
      .limit(50);

    if (!error && data) {
      setUserStats(data);
    }
  };

  const generatePasscode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = prefix + '-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGeneratePasscode = async () => {
    setGenerating(true);
    try {
      const newPasscode = generatePasscode();
      
      // Create a placeholder user_credits entry with the passcode
      const { error } = await supabase
        .from('user_credits')
        .insert({
          user_id: user!.id, // Temporary - will be updated when redeemed
          passcode: newPasscode,
          passcode_used: false,
        });

      if (error) throw error;

      toast.success('Passcode generated successfully!');
      await fetchPasscodes();
    } catch (err: any) {
      console.error('Error generating passcode:', err);
      toast.error(err.message || 'Failed to generate passcode');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deletePasscode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_credits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Passcode deleted');
      await fetchPasscodes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage passcodes and users</p>
          </div>
        </div>

        {/* Generate Passcode */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Generate Passcode</h2>
          </div>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="AUTO"
                className="mt-1.5 font-mono"
                maxLength={6}
              />
            </div>
            <Button onClick={handleGeneratePasscode} disabled={generating}>
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Generated code will look like: {prefix}-XXXXXXXX
          </p>
        </div>

        {/* Passcodes List */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Passcodes ({passcodes.length})</h2>
          </div>

          {passcodes.length > 0 ? (
            <div className="space-y-2">
              {passcodes.map((pc) => (
                <div
                  key={pc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-sm">{pc.passcode}</code>
                    <Badge variant={pc.passcode_used ? 'secondary' : 'default'}>
                      {pc.passcode_used ? 'Used' : 'Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(pc.passcode!, pc.id)}
                    >
                      {copiedId === pc.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    {!pc.passcode_used && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePasscode(pc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No passcodes generated yet</p>
          )}
        </div>

        {/* User Stats */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">User Statistics</h2>
          </div>

          {userStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground">User ID</th>
                    <th className="text-left py-2 px-3 text-muted-foreground">Uses</th>
                    <th className="text-left py-2 px-3 text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-3 text-muted-foreground">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((stat) => (
                    <tr key={stat.id} className="border-b border-border/50">
                      <td className="py-2 px-3 font-mono text-xs">{stat.user_id.slice(0, 8)}...</td>
                      <td className="py-2 px-3">{stat.total_uses}</td>
                      <td className="py-2 px-3">
                        <Badge variant={stat.is_premium ? 'default' : 'secondary'}>
                          {stat.is_premium ? 'Premium' : 'Free'}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        {stat.is_premium ? stat.premium_uses_remaining : Math.max(0, 3 - stat.total_uses)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No user data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
