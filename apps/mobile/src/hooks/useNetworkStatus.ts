import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsConnected(navigator.onLine);
      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Native: use NetInfo
      let unsubscribe: (() => void) | undefined;
      import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
        unsubscribe = NetInfo.addEventListener((state) => {
          setIsConnected(state.isConnected);
        });
      });
      return () => unsubscribe?.();
    }
  }, []);

  return isConnected;
}
