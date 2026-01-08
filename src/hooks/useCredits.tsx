import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CreditInfo {
  canUse: boolean;
  remaining: number;
  isPremium: boolean;
  totalUses: number;
  loading: boolean;
}

export function useCredits() {
  const { user } = useAuth();
  const [creditInfo, setCreditInfo] = useState<CreditInfo>({
    canUse: false,
    remaining: 3,
    isPremium: false,
    totalUses: 0,
    loading: true,
  });

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCreditInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching credits:', error);
        return;
      }

      if (data) {
        const isPremium = data.is_premium && data.premium_expires_at && new Date(data.premium_expires_at) > new Date();
        const remaining = isPremium ? data.premium_uses_remaining : Math.max(0, 3 - data.total_uses);
        
        setCreditInfo({
          canUse: remaining > 0,
          remaining,
          isPremium,
          totalUses: data.total_uses,
          loading: false,
        });
      } else {
        // No record yet, user has 3 free uses
        setCreditInfo({
          canUse: true,
          remaining: 3,
          isPremium: false,
          totalUses: 0,
          loading: false,
        });
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setCreditInfo(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const checkAndDeductCredit = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to use this feature');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error checking credits:', error);
        toast.error('Failed to verify credits');
        return false;
      }

      const result = data as { can_use: boolean; remaining: number; is_premium: boolean; total_uses: number };
      
      if (!result.can_use) {
        toast.error('No credits remaining. Upgrade to Premium for 100 monthly uses!');
        return false;
      }

      setCreditInfo({
        canUse: result.remaining > 0,
        remaining: result.remaining,
        isPremium: result.is_premium,
        totalUses: result.total_uses,
        loading: false,
      });

      return true;
    } catch (err) {
      console.error('Error deducting credit:', err);
      toast.error('Failed to process credit');
      return false;
    }
  }, [user]);

  const redeemPasscode = useCallback(async (passcode: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to redeem a passcode');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('validate_passcode', {
        p_user_id: user.id,
        p_passcode: passcode.trim(),
      });

      if (error) {
        console.error('Error validating passcode:', error);
        toast.error('Failed to validate passcode');
        return false;
      }

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast.success(result.message);
        await fetchCredits();
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (err) {
      console.error('Error redeeming passcode:', err);
      toast.error('Failed to redeem passcode');
      return false;
    }
  }, [user, fetchCredits]);

  return {
    ...creditInfo,
    checkAndDeductCredit,
    redeemPasscode,
    refreshCredits: fetchCredits,
  };
}
