import { Link } from 'react-router-dom';
import { Car, Camera, AlertTriangle, MessageSquare, Smartphone, Zap } from 'lucide-react';

const features = [
  {
    icon: Car,
    title: 'VIN Decoder',
    description: 'Instant vehicle identification and specification extraction',
    active: true,
    path: '/vin-decoder',
  },
  {
    icon: Camera,
    title: 'Damage AI',
    description: 'AI-powered damage detection and assessment',
    active: true,
    path: '/damage-ai',
  },
  {
    icon: AlertTriangle,
    title: 'Fault Codes',
    description: 'Real-time diagnostic fault code interpretation',
    active: true,
    path: '/fault-codes',
  },
  {
    icon: MessageSquare,
    title: 'Workshop Assistant',
    description: 'AI chatbot for repair guidance and parts lookup',
    active: true,
    path: '/workshop-assistant',
  },
  {
    icon: Smartphone,
    title: 'OCR Scanner',
    description: 'Scan plates and documents with your camera',
    active: true,
    path: '/ocr-scanner',
  },
  {
    icon: Zap,
    title: 'WhatsApp Integration',
    description: 'Connect with customers via WhatsApp directly',
    active: false,
    path: null,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="section-heading">Features Grid</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Modern{' '}
            <span className="gradient-text">Automotive Diagnostics</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to streamline your workshop operations and deliver faster, 
            more accurate service to your customers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const CardContent = (
              <>
                {!feature.active && (
                  <span className="coming-soon-badge">Coming Soon</span>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  feature.active 
                    ? 'bg-gradient-primary' 
                    : 'bg-secondary'
                }`}>
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
                {feature.active && (
                  <div className="mt-4 w-full h-1 bg-gradient-primary rounded-full" />
                )}
              </>
            );

            if (feature.active && feature.path) {
              return (
                <Link
                  key={feature.title}
                  to={feature.path}
                  className="feature-card relative block"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {CardContent}
                </Link>
              );
            }

            return (
              <div
                key={feature.title}
                className={`feature-card relative ${!feature.active ? 'opacity-60' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {CardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
