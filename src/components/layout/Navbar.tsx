import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Car, LayoutDashboard, Search, History, Settings, LogOut, Menu, X, Camera, AlertTriangle, MessageSquare, ScanLine } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const aiTools = [
    { path: '/damage-ai', label: 'Damage AI', icon: Camera },
    { path: '/fault-codes', label: 'Fault Codes', icon: AlertTriangle },
    { path: '/workshop-assistant', label: 'Workshop AI', icon: MessageSquare },
    { path: '/ocr-scanner', label: 'OCR Scanner', icon: ScanLine },
  ];

  const navLinks = user ? [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vin-decoder', label: 'VIN Decoder', icon: Search },
    { path: '/history', label: 'History', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
  ] : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              Auto<span className="gradient-text">Mate</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link flex items-center gap-2 ${isActive(link.path) ? 'active' : ''}`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="hero" size="sm">Start Free Trial</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            {/* AI Tools Quick Access */}
            <div className="mb-4">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Tools</p>
              <div className="grid grid-cols-2 gap-2 px-4">
                {aiTools.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className={`flex items-center gap-2 py-3 px-3 rounded-lg text-sm transition-colors ${isActive(tool.path) ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-foreground hover:bg-muted'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <tool.icon className="w-4 h-4" />
                    {tool.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            {navLinks.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</p>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 py-3 px-4 rounded-lg ${isActive(link.path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Auth Section */}
            <div className="pt-4 mt-4 border-t border-border">
              {user ? (
                <div className="px-4">
                  <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                  <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="hero" className="w-full">Start Free Trial</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
