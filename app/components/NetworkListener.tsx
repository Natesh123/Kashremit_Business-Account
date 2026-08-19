import React, { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

const NetworkListener = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const isFirstMount = useRef(true);

  useEffect(() => {
    let isMounted = true;

    const checkNetwork = async () => {
      try {
        let currentConnected = false;
        
        if (Platform.OS === 'web') {
          currentConnected = typeof navigator !== 'undefined' ? navigator.onLine : true;
        } else {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch('https://1.1.1.1', {
              method: 'HEAD',
              signal: controller.signal,
              cache: 'no-store'
            });
            currentConnected = response.ok || response.status > 0;
            clearTimeout(timeoutId);
          } catch (e) {
            currentConnected = false;
          }
        }

        if (!isMounted) return;

        if (isFirstMount.current) {
          isFirstMount.current = false;
          setIsConnected(currentConnected);
          return;
        }

        if (currentConnected !== isConnected) {
          setIsConnected(currentConnected);

          if (currentConnected === false) {
            Toast.show({
              type: 'error',
              text1: 'No Internet Connection',
              text2: 'Please check your network settings.',
              position: 'top',
              autoHide: true,
              visibilityTime: 20000,
            });
          } else if (currentConnected === true) {
            Toast.hide();
            Toast.show({
              type: 'success',
              text1: 'Back Online',
              text2: 'Your internet connection has been restored.',
              position: 'top',
              visibilityTime: 4000,
            });
          }
        }
      } catch (error) {
        console.warn('Network check failed:', error);
      }
    };

    // Check immediately on mount
    checkNetwork();

    // Poll every 3 seconds
    const interval = setInterval(checkNetwork, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isConnected]);

  return null;
};

export default NetworkListener;
