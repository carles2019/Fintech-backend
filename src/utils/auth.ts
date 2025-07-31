import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../utils/api'; // Use '@/utils/api' if aliases are configured


/**
 * Restores the user's token from secure storage and
 * sets it on the Axios instance for authenticated requests.
 * @returns boolean indicating whether a valid token was found
 */
export const restoreToken = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      setAuthToken(token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to restore token:', error);
    return false;
  }
};