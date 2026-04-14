import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  isRevenueCatEnabled,
  hasEntitlement,
  getCustomerInfo,
} from './revenuecatClient';

const SUBSCRIPTION_QUERY_KEY = ['subscription', 'premium'];

/**
 * Hook to check subscription status and gate premium features
 *
 * @example
 * const { isPremium, isLoading, requirePremium } = useSubscription();
 *
 * // Check premium status
 * if (isPremium) {
 *   // Show premium features
 * }
 *
 * // Gate a feature (opens paywall if not premium)
 * const handlePremiumFeature = () => {
 *   if (requirePremium()) {
 *     // User has premium, proceed
 *   }
 *   // If not premium, paywall is shown automatically
 * };
 */
export function useSubscription() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: isPremium = false, isLoading } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async () => {
      if (!isRevenueCatEnabled()) {
        return false;
      }

      const result = await hasEntitlement('premium');
      if (result.ok) {
        return result.data;
      }
      return false;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  /**
   * Refresh subscription status from RevenueCat
   */
  const refreshSubscription = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
  }, [queryClient]);

  /**
   * Gate a premium feature - returns true if user has premium,
   * otherwise navigates to paywall and returns false
   */
  const requirePremium = useCallback((): boolean => {
    if (isPremium) {
      return true;
    }
    router.push('/paywall');
    return false;
  }, [isPremium, router]);

  /**
   * Navigate to paywall
   */
  const openPaywall = useCallback(() => {
    router.push('/paywall');
  }, [router]);

  return {
    /** Whether the user has an active premium subscription */
    isPremium,
    /** Whether the subscription status is being loaded */
    isLoading,
    /** Gate a feature - returns true if premium, shows paywall if not */
    requirePremium,
    /** Navigate to paywall */
    openPaywall,
    /** Refresh subscription status */
    refreshSubscription,
    /** Whether RevenueCat is enabled */
    isEnabled: isRevenueCatEnabled(),
  };
}
