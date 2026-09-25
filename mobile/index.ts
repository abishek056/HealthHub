import { registerRootComponent, requireOptionalNativeModule } from 'expo';
import { NativeModules } from 'react-native';
import App from './App';

// Automatically hide the Expo Dev Menu floating action button (blue gear icon)
try {
  const DevMenuPreferences = requireOptionalNativeModule('DevMenuPreferences');
  DevMenuPreferences?.setPreferencesAsync?.({
    showFloatingActionButton: false,
  });

  if (NativeModules.DevMenuPreferences?.setPreferencesAsync) {
    NativeModules.DevMenuPreferences.setPreferencesAsync({
      showFloatingActionButton: false,
    });
  }
} catch {
  // Safely ignore if DevMenuPreferences native module is not present
}

registerRootComponent(App);
