
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { showGlobalLoader, hideGlobalLoader } from '../utils/GlobalLoaderState';

let request = axios.create({
   baseURL: 'https://tpinservice.kashremit.com/CashUIMR.svc/', 
  // baseURL: 'https://servicetokdev.kashremit.com/CashUIMR.svc/',

  //  baseURL: 'https://service.kashremit.com/CashUIMR.svc/',
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  async (config) => {
    showGlobalLoader();
    const value = await AsyncStorage.getItem('user');
    let user: any = {};
    if (value) {
      user = JSON.parse(value);
    }
    const token = user.Token || user.TokenID;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.params = {
      ...config.params,
    }
    return config;
  },
  (error) => {
    hideGlobalLoader();
    genericErrorHandler(error);
    return Promise.reject(error);
  },
);

request.interceptors.response.use(function (response) {
    hideGlobalLoader();
    return response;
}, function (error) {
    hideGlobalLoader();
    return Promise.reject(error);
});

export const setClientToken = (token: any) => {
  request.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};

import { navigate } from '../navigation/NavigationService';
import Toast from 'react-native-toast-message';

export const genericErrorHandler = (error: AxiosError<any>) => {

  const code = error.response?.status;
  if (code === 401) {
    // Clear user session and redirect to Login
    AsyncStorage.removeItem('user');
    AsyncStorage.removeItem('isLoggedIn');

    Toast.show({
      type: 'error',
      text1: 'Session Expired',
      text2: 'Please log in again to continue.',
      position: 'bottom',
    });

    navigate('Login');
  }
}

export default request;