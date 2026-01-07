import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { VinDemoSection } from '@/components/landing/VinDemoSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <VinDemoSection />
      <TrustSection />
      <Footer />
    </div>
  );
};

export default Index;
