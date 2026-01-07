import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2,
  AlertTriangle,
  Sparkles,
  Info,
  Search,
} from 'lucide-react';

const commonCodes = [
  { code: 'P0300', label: 'Random/Multiple Cylinder Misfire' },
  { code: 'P0420', label: 'Catalyst System Efficiency' },
  { code: 'P0171', label: 'System Too Lean (Bank 1)' },
  { code: 'P0442', label: 'Evap Small Leak Detected' },
  { code: 'P0128', label: 'Coolant Temp Below Thermostat' },
  { code: 'P0455', label: 'Evap Large Leak Detected' },
];

export default function FaultCodes() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [faultCode, setFaultCode] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState({ make: '', model: '', year: '' });
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleExplain = async (code?: string) => {
    const codeToExplain = code || faultCode;
    if (!codeToExplain.trim()) {
      toast.error('Please enter a fault code');
      return;
    }

    setLoading(true);
    setExplanation(null);

    try {
      const { data, error } = await supabase.functions.invoke('explain-fault-code', {
        body: {
          faultCode: codeToExplain.toUpperCase(),
          vehicleInfo: vehicleInfo.make ? vehicleInfo : null,
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setExplanation(data.explanation);
      setFaultCode(codeToExplain.toUpperCase());
      toast.success('Fault code explained!');
    } catch (error) {
      console.error('Error explaining fault code:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to explain fault code');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Fault Code <span className="gradient-text">Explainer</span>
          </h1>
          <p className="text-muted-foreground">
            Enter an OBD-II/DTC code for a plain-English explanation
          </p>
        </div>

        {/* Input Section */}
        <div className="glass-card p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm text-muted-foreground mb-2">
              Enter Fault Code (e.g., P0420, B1234, C0500, U0100)
            </label>
            <div className="flex gap-3">
              <Input
                value={faultCode}
                onChange={(e) => setFaultCode(e.target.value.toUpperCase())}
                placeholder="P0420"
                className="text-xl font-mono tracking-wider flex-1"
                maxLength={10}
              />
              <Button
                variant="hero"
                onClick={() => handleExplain()}
                disabled={loading || !faultCode.trim()}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Explain
              </Button>
            </div>
          </div>

          {/* Optional Vehicle Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Optional: Add vehicle info for more specific results
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Input
                value={vehicleInfo.year}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
                placeholder="Year"
              />
              <Input
                value={vehicleInfo.make}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                placeholder="Make"
              />
              <Input
                value={vehicleInfo.model}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                placeholder="Model"
              />
            </div>
          </div>
        </div>

        {/* Common Codes Quick Select */}
        <div className="glass-card p-6 mb-6">
          <h3 className="font-semibold mb-4">Common Fault Codes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {commonCodes.map((item) => (
              <button
                key={item.code}
                onClick={() => handleExplain(item.code)}
                disabled={loading}
                className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
              >
                <div className="font-mono text-primary font-semibold">{item.code}</div>
                <div className="text-xs text-muted-foreground truncate">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-center gap-3 p-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>AI is analyzing the fault code...</span>
            </div>
          </div>
        )}

        {/* Explanation Results */}
        {explanation && (
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Code: {faultCode}</h2>
                <p className="text-sm text-muted-foreground">AI Explanation</p>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {explanation}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
