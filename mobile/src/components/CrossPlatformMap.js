import { Platform } from 'react-native';

let CrossPlatformMap;

if (Platform.OS === 'web') {
  CrossPlatformMap = require('./CrossPlatformMap.web').default;
} else {
  CrossPlatformMap = require('./CrossPlatformMap.native').default;
}

export default CrossPlatformMap;
