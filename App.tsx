import React, { useState } from "react";

import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RecoilRoot } from "recoil";
import useCachedResources from "./app/hooks/useCachedResources";
import Navigation from "./app/navigation";
import Toast from "react-native-toast-message";
import { MenuProvider } from "react-native-popup-menu";
import * as SplashScreen from "expo-splash-screen";
import AnimatedSplashScreen from "./app/components/AnimatedSplashScreen";
import NetworkListener from "./app/components/NetworkListener";
import GlobalLoader from "./app/components/GlobalLoader";

// Keep the native splash screen visible until we decide to hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore errors if prevention fails */
});

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const [splashComplete, setSplashComplete] = useState(false);

  // Hide the native static splash screen as soon as the JS bundle loads
  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Ignore errors if the native splash screen has already been hidden
    });
  }, []);

  if (!isLoadingComplete || !splashComplete) {
    return <AnimatedSplashScreen onAnimationComplete={() => setSplashComplete(true)} />;
  }

  return (
    <RecoilRoot>
      <SafeAreaProvider>
        <MenuProvider >
          <NetworkListener />
          <GlobalLoader />
          <Navigation colorScheme={colorScheme} />
          <StatusBar hidden={true} />
          <Toast />
        </MenuProvider>
      </SafeAreaProvider>
    </RecoilRoot>
  );
}
