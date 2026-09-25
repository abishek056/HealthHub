import React, { createContext, useContext } from 'react';
import { User } from '../api/auth';

export type AuthContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  handleLogout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  handleLogout: async () => {},
});

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthContext.Provider');
  }
  return context;
}
