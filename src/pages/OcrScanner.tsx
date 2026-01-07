import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Loader2,
  Camera,
  Upload,
  X,
  Sparkles,
  Car,
  FileText,
  CreditCard,
  RotateCcw,
  Check,
  Copy,
} from 'lucide-react';

type ScanType = 'license_plate' | 'vin' | 'document' | 'general';

const scanTypes = [
  { id: 'license_plate' as ScanType, icon: CreditCard, label: 'License Plate', description: 'Scan vehicle plates' },
  { id: 'vin' as ScanType, icon: Car, label: 'VIN Number', description: 'Read VIN from sticker/plate' },
  { id: 'document' as ScanType, icon: FileText, label: 'Document', description: 'Registration, insurance, etc.' },
];

export default function OcrScanner() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [scanType, setScanType] = useState<ScanType>('license_plate');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setImage(null);
      setResult(null);
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Could not access camera. Please use file upload instead.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image too large. Please use an image under 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      const base64 = image.split(',')[1];
      
      const { data, error } = await supabase.functions.invoke('ocr-scan', {
        body: { imageBase64: base64, scanType },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setResult(data.result);
      toast.success('Scan complete!');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scan image');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const clearAll = () => {
    setImage(null);
    setResult(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              <Camera className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            OCR <span className="gradient-text">Scanner</span>
          </h1>
          <p className="text-muted-foreground">
            Scan license plates, VINs, and vehicle documents instantly
          </p>
        </div>

        {/* Scan Type Selection */}
        <div className="glass-card p-4 mb-6">
          <p className="text-sm text-muted-foreground mb-3">What would you like to scan?</p>
          <div className="grid grid-cols-3 gap-3">
            {scanTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setScanType(type.id)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  scanType === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <type.icon className={`w-6 h-6 mx-auto mb-2 ${scanType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Camera/Upload Area */}
        <div className="glass-card p-6 mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />

          {cameraActive ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              {/* Scan overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`border-2 border-primary/70 rounded-lg ${
                  scanType === 'license_plate' ? 'w-64 h-20' : 
                  scanType === 'vin' ? 'w-80 h-12' : 
                  'w-72 h-96'
                }`} />
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <Button variant="outline" onClick={stopCamera}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="hero" onClick={capturePhoto}>
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          ) : !image ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={startCamera}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Camera className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <p className="font-medium">Use Camera</p>
                  <p className="text-xs text-muted-foreground mt-1">Take a photo</p>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-accent" />
                  <p className="font-medium">Upload Image</p>
                  <p className="text-xs text-muted-foreground mt-1">From your device</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={clearAll}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={image}
                alt="Captured"
                className="w-full max-h-80 object-contain rounded-lg"
              />
            </div>
          )}

          {image && !loading && !result && (
            <Button
              variant="hero"
              className="w-full mt-6"
              onClick={handleScan}
            >
              <Sparkles className="w-5 h-5" />
              Scan {scanTypes.find(t => t.id === scanType)?.label}
            </Button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-3 mt-6 p-4 rounded-lg bg-primary/10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>AI is reading the {scanType.replace('_', ' ')}...</span>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <h2 className="text-lg font-semibold">Scan Results</h2>
            </div>

            {/* License Plate Result */}
            {scanType === 'license_plate' && result.plate_number && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">License Plate</div>
                    <div className="text-3xl font-mono font-bold tracking-wider">{result.plate_number}</div>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.plate_number)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Region:</span>{' '}
                    <span className="font-medium">{result.country_region || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>{' '}
                    <span className={`font-medium ${
                      result.confidence === 'high' ? 'text-success' :
                      result.confidence === 'medium' ? 'text-warning' : 'text-destructive'
                    }`}>{result.confidence}</span>
                  </div>
                </div>
                {result.notes && (
                  <p className="text-sm text-muted-foreground italic">{result.notes}</p>
                )}
              </div>
            )}

            {/* VIN Result */}
            {scanType === 'vin' && result.vin && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">VIN</div>
                    <div className="text-xl font-mono font-bold tracking-wider text-primary">{result.vin}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.vin)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="default" size="sm" onClick={() => navigate(`/vin-decoder?vin=${result.vin}`)}>
                      Decode VIN
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Validation:</span>{' '}
                    <span className={`font-medium ${result.validation?.includes('Valid') ? 'text-success' : 'text-warning'}`}>
                      {result.validation || 'Unchecked'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>{' '}
                    <span className={`font-medium ${
                      result.confidence === 'high' ? 'text-success' :
                      result.confidence === 'medium' ? 'text-warning' : 'text-destructive'
                    }`}>{result.confidence}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Document Result */}
            {scanType === 'document' && result.extracted_data && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-xs text-muted-foreground mb-2">Document Type</div>
                  <div className="font-semibold">{result.document_type || 'Unknown'}</div>
                </div>
                
                {result.extracted_data.vehicle_info && (
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <div className="text-xs text-muted-foreground mb-2">Vehicle Information</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(result.extracted_data.vehicle_info).map(([key, value]) => 
                        value && (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>{' '}
                            <span className="font-medium">{value as string}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {result.extracted_data.owner_info?.name && (
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <div className="text-xs text-muted-foreground mb-2">Owner Information</div>
                    <div className="text-sm">
                      <div className="font-medium">{result.extracted_data.owner_info.name}</div>
                      {result.extracted_data.owner_info.address && (
                        <div className="text-muted-foreground">{result.extracted_data.owner_info.address}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Raw text fallback */}
            {result.raw_text && (
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground mb-2">Extracted Text</div>
                <div className="text-sm whitespace-pre-wrap">{result.raw_text}</div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Scan Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
