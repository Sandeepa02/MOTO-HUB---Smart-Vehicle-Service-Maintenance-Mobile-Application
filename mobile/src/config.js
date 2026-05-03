import { Platform } from 'react-native';

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

const devHost = Platform.select({
  android: '10.0.2.2',
  default: 'localhost'
});

export const API_BASE_URL = envBaseUrl ?? `http://${devHost}:5000/api`;
