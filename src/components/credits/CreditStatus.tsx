import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Loader2, Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CreditStatus() {
  const { remaining, isPremium, loading, redeemPasscode } = useCredits();
  const [passcode, setPasscode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [open, setOpen] = useState(false);

  const handleRedeem = async () => {
    if (!passcode.trim()) return;
    
    setRedeeming(true);
    const success = await redeemPasscode(passcode);
    setRedeeming(false);
    
    if (success) {
      setPasscode('');
      setOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {isPremium ? (
          <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        ) : (
          <Badge variant="secondary">
            <Zap className="w-3 h-3 mr-1" />
            Free
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          {remaining} {remaining === 1 ? 'credit' : 'credits'} left
        </span>
      </div>

      {!isPremium && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Gift className="w-3 h-3" />
              Redeem Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Redeem Premium Passcode</DialogTitle>
              <DialogDescription>
                Enter your passcode to activate Premium (100 uses/month for 30 days)
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                placeholder="Enter passcode"
                className="font-mono"
                disabled={redeeming}
              />
              <Button onClick={handleRedeem} disabled={!passcode.trim() || redeeming}>
                {redeeming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Activate'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
