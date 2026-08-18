import React, { useEffect, useState } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { DeviceEventEmitter } from 'react-native';
import { SHOW_LOADER_EVENT, HIDE_LOADER_EVENT } from '../utils/GlobalLoaderState';
import { useColorScheme } from 'react-native';

const GlobalLoader = () => {
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const showSubscription = DeviceEventEmitter.addListener(SHOW_LOADER_EVENT, () => setLoading(true));
    const hideSubscription = DeviceEventEmitter.addListener(HIDE_LOADER_EVENT, () => setLoading(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <Spinner
      visible={loading}
      overlayColor="rgba(0, 0, 0, 0.4)"
    />
  );
};

export default GlobalLoader;
