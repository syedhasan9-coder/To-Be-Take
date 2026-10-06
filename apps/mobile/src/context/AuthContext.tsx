import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { CustomerUser } from '../types';
import { loginCustomer, registerCustomer, RegisterPayload, ApiAuthResult } from '../services/api';
import { saveCustomerSession, getCustomerSession, clearCustomerSession } from '../services/storage';

interface AuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<ApiAuthResult>;
  register: (payload: RegisterPayload) => Promise<ApiAuthResult>;
  logout: () => Promise<void>;
  setUserManually: (user: CustomerUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on app launch
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const savedSession = await getCustomerSession();
        if (savedSession && isMounted) {
          setUser(savedSession);
        }
      } catch (err) {
        console.warn('Failed to restore customer session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string): Promise<ApiAuthResult> => {
      const result = await loginCustomer(identifier, password);
      if (result.success && result.user) {
        setUser(result.user);
        await saveCustomerSession(result.user, result.token);
      }
      return result;
    },
    [],
  );

  const register = useCallback(async (payload: RegisterPayload): Promise<ApiAuthResult> => {
    const result = await registerCustomer(payload);
    if (result.success && result.user) {
      setUser(result.user);
      await saveCustomerSession(result.user, result.token);
    }
    return result;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    await clearCustomerSession();
  }, []);

  const setUserManually = useCallback((newUser: CustomerUser | null) => {
    setUser(newUser);
    if (newUser) {
      saveCustomerSession(newUser);
    } else {
      clearCustomerSession();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        setUserManually,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
