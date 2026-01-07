import { useState, useRef, useEffect } from 'react';
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
  AlertTriangle,
} from 'lucide-react';

export default function DamageAI() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image too large. Please use an image under 10MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('analyze-damage', {
          body: { imageBase64: base64 },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setAnalysis(data.analysis);
        toast.success('Damage analysis complete!');
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error('Error analyzing damage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze damage');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageFile(null);
    setAnalysis(null);
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
            Damage <span className="gradient-text">AI</span>
          </h1>
          <p className="text-muted-foreground">
            Upload a photo of vehicle damage for instant AI analysis
          </p>
        </div>

        {/* Upload Area */}
        <div className="glass-card p-8 mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {!image ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop an image here or click to upload</p>
              <p className="text-sm text-muted-foreground">
                Supports JPG, PNG, WebP up to 10MB
              </p>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={image}
                alt="Vehicle damage"
                className="w-full max-h-96 object-contain rounded-lg"
              />
            </div>
          )}

          {image && !loading && !analysis && (
            <Button
              variant="hero"
              className="w-full mt-6"
              onClick={handleAnalyze}
            >
              <Sparkles className="w-5 h-5" />
              Analyze Damage
            </Button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-3 mt-6 p-4 rounded-lg bg-primary/10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>AI is analyzing the damage...</span>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold">AI Analysis</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {analysis}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex gap-4">
              <Button variant="outline" onClick={clearImage}>
                Analyze Another
              </Button>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="glass-card p-4 mt-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Disclaimer:</strong> This AI analysis is for informational purposes only. 
            Always consult a professional mechanic or body shop for accurate damage assessment and repair quotes.
          </div>
        </div>
      </div>
    </div>
  );
}
