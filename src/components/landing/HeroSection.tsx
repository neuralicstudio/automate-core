import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight } from 'lucide-react';
import heroCarImage from '@/assets/hero-car.jpg';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/20 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              The Operating System for{' '}
              <span className="gradient-text">Automotive Intelligence</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              AI-powered diagnostics trusted by 500+ dealerships worldwide. 
              Decode VINs, detect damage, and diagnose faults in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?mode=signup">
                <Button variant="hero" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="heroOutline" className="w-full sm:w-auto">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
              <div>
                <div className="text-2xl md:text-3xl font-bold gradient-text">500+</div>
                <div className="text-sm text-muted-foreground">Dealerships</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold gradient-text">1M+</div>
                <div className="text-sm text-muted-foreground">VINs Decoded</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold gradient-text">&lt;100ms</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
            </div>
          </div>

          {/* Right - Hero Image */}
          <div className="relative animate-slide-in-right">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={heroCarImage}
                alt="Automotive Intelligence Platform"
                className="w-full h-auto rounded-2xl"
              />
              {/* Floating UI Elements */}
              <div className="absolute top-4 right-4 glass-card px-4 py-2 animate-float">
                <div className="text-xs text-muted-foreground">VIN</div>
                <div className="font-mono text-primary text-sm">5YJSA1E26HF178932</div>
              </div>
              <div className="absolute bottom-4 left-4 glass-card px-4 py-2 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success pulse-dot" />
                  <span className="text-sm text-success">Decoded Successfully</span>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-radial from-primary/30 via-transparent to-transparent -z-10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
