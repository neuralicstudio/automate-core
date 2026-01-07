import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Check,
  AlertCircle,
  Car,
  Settings,
  Factory,
  Sparkles,
} from 'lucide-react';

interface VehicleData {
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  bodyStyle: string;
  plantCity: string;
  plantCountry: string;
  manufacturer: string;
}

const genZResponses = [
  "Yo, here's your ride's deets! 🚗",
  "Ayy, we cracked the code on this bad boy! 🔥",
  "No cap, here's everything about your whip! 💯",
  "Bet! Got all the specs for you fam! 🏎️",
];

export default function VinDecoder() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vin, setVin] = useState(searchParams.get('vin') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VehicleData | null>(null);
  const [error, setError] = useState('');
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (searchParams.get('vin') && user) {
      handleDecode();
    }
  }, [searchParams, user]);

  const isValidVin = (vin: string) => /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);

  const handleDecode = async () => {
    if (!isValidVin(vin)) {
      setError('Please enter a valid 17-character VIN');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    const startTime = Date.now();

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
      );
      const data = await response.json();
      const responseTime = Date.now() - startTime;

      const getVar = (name: string) =>
        data.Results?.find((r: any) => r.Variable === name)?.Value || '';

      const vehicleData: VehicleData = {
        make: getVar('Make') || 'Unknown',
        model: getVar('Model') || 'Unknown',
        year: getVar('Model Year') || 'Unknown',
        trim: getVar('Trim') || getVar('Series') || 'Base',
        engine: getVar('Engine Model') || `${getVar('Displacement (L)')}L ${getVar('Engine Configuration')}`.trim() || 'N/A',
        transmission: getVar('Transmission Style') || 'N/A',
        drivetrain: getVar('Drive Type') || 'N/A',
        fuelType: getVar('Fuel Type - Primary') || 'N/A',
        bodyStyle: getVar('Body Class') || 'N/A',
        plantCity: getVar('Plant City') || 'N/A',
        plantCountry: getVar('Plant Country') || 'N/A',
        manufacturer: getVar('Manufacturer Name') || 'N/A',
      };

      setResult(vehicleData);
      setAiMessage(genZResponses[Math.floor(Math.random() * genZResponses.length)]);

      // Save to database
      if (user) {
        await supabase.from('vehicles').insert({
          user_id: user.id,
          vin: vin.toUpperCase(),
          make: vehicleData.make,
          model: vehicleData.model,
          year: parseInt(vehicleData.year) || null,
          trim: vehicleData.trim,
          engine: vehicleData.engine,
          transmission: vehicleData.transmission,
          drivetrain: vehicleData.drivetrain,
          fuel_type: vehicleData.fuelType,
          body_style: vehicleData.bodyStyle,
          plant_city: vehicleData.plantCity,
          plant_country: vehicleData.plantCountry,
          manufacturer: vehicleData.manufacturer,
          raw_data: data,
        });

        await supabase.from('vin_lookups').insert({
          user_id: user.id,
          vin: vin.toUpperCase(),
          success: true,
          response_time_ms: responseTime,
        });
      }
    } catch (err) {
      setError('Failed to decode VIN. Please try again.');
      if (user) {
        await supabase.from('vin_lookups').insert({
          user_id: user.id,
          vin: vin.toUpperCase(),
          success: false,
        });
      }
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
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            VIN <span className="gradient-text">Decoder</span>
          </h1>
          <p className="text-muted-foreground">
            Enter a VIN to instantly decode vehicle information
          </p>
        </div>

        {/* VIN Input Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />

            <div className="mb-6">
              <label className="block text-sm text-muted-foreground mb-2">
                Enter 17-character VIN
              </label>
              <Input
                value={vin}
                onChange={(e) => {
                  setVin(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="5YJSA1E26HF178932"
                maxLength={17}
                className="vin-input h-16"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{vin.length}/17 characters</span>
                {vin.length === 17 && isValidVin(vin) && (
                  <span className="text-success flex items-center gap-1">
                    <Check className="w-3 h-3" /> Valid format
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button
              variant="hero"
              className="w-full"
              onClick={handleDecode}
              disabled={loading || vin.length !== 17}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Decoding...
                </>
              ) : (
                'Decode VIN'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Instant results, &lt;100ms response time
            </p>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* AI Message */}
            <div className="glass-card p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <p className="text-lg">{aiMessage}</p>
            </div>

            {/* Vehicle Info Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Vehicle Information */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Vehicle Information</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Make:</span>
                    <span className="font-medium">{result.make}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{result.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="font-medium">{result.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trim:</span>
                    <span className="font-medium">{result.trim}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VIN:</span>
                    <span className="font-mono text-primary text-sm">{vin}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-success">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Decoded Successfully</span>
                </div>
              </div>

              {/* Specifications */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold">Specifications</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engine:</span>
                    <span className="font-medium text-right max-w-[60%]">{result.engine}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transmission:</span>
                    <span className="font-medium">{result.transmission}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drivetrain:</span>
                    <span className="font-medium">{result.drivetrain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Type:</span>
                    <span className="font-medium">{result.fuelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Body Style:</span>
                    <span className="font-medium">{result.bodyStyle}</span>
                  </div>
                </div>
              </div>

              {/* Manufacturing */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Factory className="w-5 h-5 text-warning" />
                  </div>
                  <h3 className="font-semibold">Manufacturing</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span className="font-medium text-right max-w-[60%]">{result.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plant City:</span>
                    <span className="font-medium">{result.plantCity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-medium">{result.plantCountry}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decode Another */}
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setVin('');
                  setResult(null);
                }}
              >
                Decode Another VIN
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
