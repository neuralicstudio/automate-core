import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function VinDemoSection() {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const isValidVin = (vin: string) => /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);

  const handleDecode = async () => {
    if (!isValidVin(vin)) {
      setError('Please enter a valid 17-character VIN');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
      );
      const data = await response.json();
      
      const getVar = (name: string) => 
        data.Results?.find((r: any) => r.Variable === name)?.Value || 'N/A';
      
      setResult({
        make: getVar('Make'),
        model: getVar('Model'),
        year: getVar('Model Year'),
        trim: getVar('Trim'),
        engine: getVar('Engine Model') || getVar('Displacement (L)') + 'L',
        transmission: getVar('Transmission Style'),
        drivetrain: getVar('Drive Type'),
        plantCity: getVar('Plant City'),
        plantCountry: getVar('Plant Country'),
      });
    } catch (err) {
      setError('Failed to decode VIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="section-heading">Live Demo</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Try It Now - <span className="gradient-text">Free VIN Decoder</span>
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 relative overflow-hidden">
            {/* Scan line effect */}
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

            {/* Result Preview */}
            {result && (
              <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/30 animate-scale-in">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-success font-semibold">Decoded Successfully!</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Make:</span>{' '}
                    <span className="font-semibold">{result.make}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model:</span>{' '}
                    <span className="font-semibold">{result.model}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Year:</span>{' '}
                    <span className="font-semibold">{result.year}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Drivetrain:</span>{' '}
                    <span className="font-semibold">{result.drivetrain}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Link to="/auth?mode=signup">
                    <Button variant="outline" size="sm" className="w-full">
                      Sign up for full details + history
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
