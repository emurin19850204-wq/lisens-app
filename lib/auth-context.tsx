/**
 * LISENS - 認証コンテキスト（簡易メール認証版）
 * 
 * Supabase Auth ではなく、usersテーブルのメールアドレスで直接認証する。
 * 社内利用のため、パスワードは使用しない（メールアドレスだけでログイン）。
 * セッションはlocalStorageに保存。
 */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from './types';
import { getUserByEmail } from './data';

const AUTH_STORAGE_KEY = 'lisens_auth_email';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化: localStorageからメールアドレスを復元
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedEmail = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedEmail) {
          const appUser = await getUserByEmail(savedEmail);
          setUser(appUser || null);
          if (!appUser) {
            // メールが見つからない場合はストレージをクリア
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('認証初期化エラー:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // ログイン処理（メールアドレスでusersテーブルを検索）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    try {
      const appUser = await getUserByEmail(email);
      if (appUser) {
        setUser(appUser);
        localStorage.setItem(AUTH_STORAGE_KEY, email);
        return true;
      }
      return false;
    } catch (e) {
      console.error('ログインエラー:', e);
      return false;
    }
  }, []);

  // ログアウト処理
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** 認証状態を取得するフック */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth は AuthProvider 内で使用してください');
  }
  return context;
}
