import { Link } from 'react-router-dom';
import { Car, Twitter, Github, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Car className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                Auto<span className="gradient-text">Mate</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              The operating system for automotive intelligence. AI-powered diagnostics for modern workshops.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Guides</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AutoMate Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
