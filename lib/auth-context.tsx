/**
 * LISENS - 認証コンテキスト（Supabase Auth版）
 * 
 * Supabase Auth でメール＋パスワード認証を行う。
 * ログイン後、auth.users の UID を使って アプリの users テーブルと紐付ける。
 */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from './types';
import { getSupabase } from './supabase';
import { getUserByEmail, getUserByAuthUid, linkAuthUid } from './data';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Auth UIDからアプリユーザーを解決する共通関数 */
async function resolveAppUser(authUid: string, email?: string): Promise<User | null> {
  // まずauth_uidで検索
  const byUid = await getUserByAuthUid(authUid);
  if (byUid) return byUid;

  // 未紐付けの場合、メールで検索して紐付け
  if (email) {
    const byEmail = await getUserByEmail(email);
    if (byEmail) {
      await linkAuthUid(byEmail.id, authUid);
      return byEmail;
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化: Supabase Auth セッションを復元
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          const appUser = await resolveAppUser(session.user.id, session.user.email);
          setUser(appUser);
        }
      } catch (e) {
        console.error('認証初期化エラー:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    initAuth();

    return () => { mounted = false; };
  }, []);

  // ログイン処理（Supabase Auth）
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Supabase Auth ログインエラー:', error.message);
        return false;
      }
      
      if (data.user) {
        const appUser = await resolveAppUser(data.user.id, data.user.email ?? undefined);
        setUser(appUser);
        return !!appUser;
      }
      return false;
    } catch (e) {
      console.error('ログインエラー:', e);
      return false;
    }
  }, []);

  // ログアウト処理
  const logout = useCallback(async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('ログアウトエラー:', e);
    }
    setUser(null);
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
