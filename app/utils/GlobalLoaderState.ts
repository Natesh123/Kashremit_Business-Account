import { DeviceEventEmitter } from 'react-native';

export const SHOW_LOADER_EVENT = 'SHOW_LOADER_EVENT';
export const HIDE_LOADER_EVENT = 'HIDE_LOADER_EVENT';

let activeRequests = 0;

export const showGlobalLoader = () => {
  activeRequests++;
  if (activeRequests === 1) {
    DeviceEventEmitter.emit(SHOW_LOADER_EVENT);
  }
};

export const hideGlobalLoader = () => {
  if (activeRequests > 0) {
    activeRequests--;
  }
  if (activeRequests === 0) {
    DeviceEventEmitter.emit(HIDE_LOADER_EVENT);
  }
};
