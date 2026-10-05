import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerUser } from '../types';

const SESSION_KEY = '@tobetake_customer_session';
const TOKEN_KEY = '@tobetake_customer_token';

// In-memory fallback in case storage is restricted
let memorySession: CustomerUser | null = null;
let memoryToken: string | null = null;

export async function saveCustomerSession(user: CustomerUser, token?: string): Promise<void> {
  memorySession = user;
  try {
    const jsonValue = JSON.stringify(user);
    await AsyncStorage.setItem(SESSION_KEY, jsonValue);
    if (token) {
      memoryToken = token;
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.warn('Failed to save session to AsyncStorage, using memory fallback:', error);
  }
}

export async function getCustomerSession(): Promise<CustomerUser | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(SESSION_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue) as CustomerUser;
      memorySession = parsed;
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to retrieve session from AsyncStorage, checking memory:', error);
  }
  return memorySession;
}

export async function getCustomerToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      memoryToken = token;
      return token;
    }
  } catch (error) {
    console.warn('Failed to retrieve token from AsyncStorage:', error);
  }
  return memoryToken;
}

export async function clearCustomerSession(): Promise<void> {
  memorySession = null;
  memoryToken = null;
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to clear session from AsyncStorage:', error);
  }
}

