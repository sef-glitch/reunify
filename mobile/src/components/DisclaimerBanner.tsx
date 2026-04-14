import { View, Text } from 'react-native';
import { Info } from 'lucide-react-native';

export function DisclaimerBanner() {
  return (
    <View className="bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 flex-row items-center border-b border-amber-200/50 dark:border-amber-800/30">
      <Info size={14} color="#b45309" className="mr-2" />
      <Text className="text-amber-700 dark:text-amber-400 text-xs flex-1 ml-2">
        Information support only — not legal advice.
      </Text>
    </View>
  );
}
