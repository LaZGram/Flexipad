import { Platform } from 'react-native';

// API Configuration for Backend Communication

/**
 * Backend API Base URL Configuration
 * 
 * Platform-specific URLs:
 * - Android Emulator: Use '10.0.2.2' (emulator's special alias to host machine)
 * - iOS Simulator: Use 'localhost' or '127.0.0.1'
 * - Physical Device: Use your computer's local IP (check ipconfig/ifconfig)
 * 
 * How to find your local IP:
 * - Windows: Run 'ipconfig' in CMD, look for "IPv4 Address"
 * - Mac/Linux: Run 'ifconfig' or 'ip addr', look for your network interface
 * 
 * Current setting: 172.18.16.1 (your local network IP)
 */

const getBaseUrl = (): string => {
  // For physical devices or when you know your local IP, use it directly
  const LOCAL_IP = '10.31.62.42'; // Update this with your computer's IP
  
  if (Platform.OS === 'android') {
    // Android emulator: use 10.0.2.2
    // Physical Android device: use your local IP
    return `http://${LOCAL_IP}:3000`;
    // For emulator, change to: return 'http://10.0.2.2:3000';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    // Physical iOS device: use your local IP
    return `http://${LOCAL_IP}:3000`;
    // For simulator, change to: return 'http://localhost:3000';
  }
  
  // Web or other platforms
  return `http://${LOCAL_IP}:3000`;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    ONE_PAD_MODE_SESSIONS: '/one-pad-mode/sessions',
    PATTERN_MODE_SESSIONS: '/pattern-mode/sessions',
    PATTERN_MODE_TEMPLATES: '/pattern-mode/templates',
    HIT_MODE_TEMPLATES: '/hit-mode/templates',
    HIT_MODE_SESSIONS: '/hit-mode/sessions',
  },
};

/**
 * Helper to get full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
