import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEvidenceQueue } from '@/lib/evidence-queue';
import { useEffect } from 'react';

interface SyncIndicatorProps {
  onPress?: () => void;
  compact?: boolean;
}

export function SyncIndicator({ onPress, compact = false }: SyncIndicatorProps) {
  const isOnline = useEvidenceQueue((s) => s.isOnline);
  const isSyncing = useEvidenceQueue((s) => s.isSyncing);
  const queue = useEvidenceQueue((s) => s.queue);

  const pendingCount = queue.filter((item) => item.status === 'pending').length;
  const failedCount = queue.filter((item) => item.status === 'failed').length;
  const totalQueued = pendingCount + failedCount;

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isSyncing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [isSyncing, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (compact) {
    // Compact version for header
    if (!totalQueued && isOnline) return null;

    return (
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-2 py-1 rounded-full"
        style={{
          backgroundColor: !isOnline
            ? 'rgba(239, 68, 68, 0.1)'
            : failedCount > 0
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(13, 148, 136, 0.1)',
        }}
        accessibilityLabel={
          !isOnline
            ? 'Offline'
            : failedCount > 0
              ? `${failedCount} failed uploads`
              : `${pendingCount} items pending upload`
        }
        accessibilityRole="button"
      >
        {!isOnline ? (
          <CloudOff size={14} color="#ef4444" />
        ) : isSyncing ? (
          <Animated.View style={animatedStyle}>
            <RefreshCw size={14} color="#0d9488" />
          </Animated.View>
        ) : failedCount > 0 ? (
          <AlertCircle size={14} color="#f59e0b" />
        ) : (
          <Cloud size={14} color="#0d9488" />
        )}
        {totalQueued > 0 && (
          <Text
            className="ml-1 text-xs font-medium"
            style={{
              color: !isOnline ? '#ef4444' : failedCount > 0 ? '#f59e0b' : '#0d9488',
            }}
          >
            {totalQueued}
          </Text>
        )}
      </Pressable>
    );
  }

  // Full version for evidence screen
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-3 mx-4 my-2 rounded-xl border"
      style={{
        backgroundColor: !isOnline
          ? 'rgba(239, 68, 68, 0.05)'
          : failedCount > 0
            ? 'rgba(245, 158, 11, 0.05)'
            : totalQueued > 0
              ? 'rgba(13, 148, 136, 0.05)'
              : 'rgba(13, 148, 136, 0.03)',
        borderColor: !isOnline
          ? 'rgba(239, 68, 68, 0.2)'
          : failedCount > 0
            ? 'rgba(245, 158, 11, 0.2)'
            : 'rgba(13, 148, 136, 0.15)',
      }}
      accessibilityLabel={
        !isOnline
          ? 'Offline — evidence will be saved locally'
          : failedCount > 0
            ? `${failedCount} uploads failed`
            : totalQueued > 0
              ? `${totalQueued} items waiting to upload`
              : 'All evidence saved locally'
      }
      accessibilityRole="button"
    >
      <View className="flex-row items-center flex-1">
        {!isOnline ? (
          <View className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center">
            <CloudOff size={16} color="#ef4444" />
          </View>
        ) : isSyncing ? (
          <View className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 items-center justify-center">
            <Animated.View style={animatedStyle}>
              <RefreshCw size={16} color="#0d9488" />
            </Animated.View>
          </View>
        ) : failedCount > 0 ? (
          <View className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center">
            <AlertCircle size={16} color="#f59e0b" />
          </View>
        ) : (
          <View className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 items-center justify-center">
            <Cloud size={16} color="#0d9488" />
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text
            className="font-medium text-sm"
            style={{
              color: !isOnline ? '#ef4444' : failedCount > 0 ? '#f59e0b' : '#0d9488',
            }}
          >
            {!isOnline
              ? 'Offline Mode'
              : isSyncing
                ? 'Syncing...'
                : failedCount > 0
                  ? `${failedCount} Failed Upload${failedCount > 1 ? 's' : ''}`
                  : totalQueued > 0
                    ? `${totalQueued} Pending`
                    : 'All Synced'}
          </Text>
          <Text className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
            {!isOnline
              ? 'Evidence saved locally'
              : failedCount > 0
                ? 'Tap to retry'
                : totalQueued > 0
                  ? 'Will upload when connected'
                  : 'Evidence stored on device'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
