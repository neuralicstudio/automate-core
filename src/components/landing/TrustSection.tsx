import { Building2, Wrench, Car, Settings } from 'lucide-react';

const trustBadges = [
  { icon: Building2, name: 'Dealership Inc' },
  { icon: Settings, name: 'AutoTech Solutions' },
  { icon: Wrench, name: 'CarPro Services' },
  { icon: Car, name: 'Vehicle Dynamics' },
];

const testimonials = [
  {
    name: 'John Smith',
    role: 'Service Manager, City Motors',
    quote: 'The AI diagnostics have drastically reduced our repair times and improved accuracy.',
    rating: 5,
  },
  {
    name: 'Sarah Johnson',
    role: 'Lead Technician, AutoFix Pro',
    quote: "Incredibly fast and reliable. It's an indispensable tool in our workshop.",
    rating: 5,
  },
  {
    name: 'Michael Lee',
    role: 'Owner, Elite Auto Care',
    quote: "A game-changer for our dealership's efficiency and customer satisfaction.",
    rating: 5,
  },
];

export function TrustSection() {
  return (
    <section className="py-24 relative bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Trust Badges */}
        <div className="text-center mb-16">
          <span className="section-heading">Trust Badges</span>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Trusted by <span className="gradient-text">500+ automotive dealerships</span>
          </h2>
          
          <div className="flex flex-wrap justify-center gap-6">
            {trustBadges.map((badge) => (
              <div key={badge.name} className="trust-badge">
                <badge.icon className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <span className="section-heading">Testimonials</span>
            <h2 className="text-2xl md:text-3xl font-bold">
              What Our <span className="gradient-text">Customers Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.name}
                className="glass-card p-6 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">"{testimonial.quote}"</p>
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <span key={i} className="text-warning">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
