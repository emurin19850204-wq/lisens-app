/**
 * LISENS - 認証コンテキスト（Supabase Auth版）
 * 
 * Supabase Auth でメール＋パスワード認証を行う。
 * ログイン後、auth.users の UID を使って アプリの users テーブルと紐付ける。
 * セッションは Supabase Auth が自動管理する。
 */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from './types';
import { getSupabase } from './supabase';
import { getUserByEmail, getUserByAuthUid, linkAuthUid } from './data';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化: Supabase Auth セッションを復元
  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // auth_uid でアプリユーザーを検索
          let appUser = await getUserByAuthUid(session.user.id);
          
          if (!appUser && session.user.email) {
            // auth_uid未紐付け → メールで検索して紐付け
            appUser = await getUserByEmail(session.user.email);
            if (appUser) {
              await linkAuthUid(appUser.id, session.user.id);
            }
          }
          
          setUser(appUser || null);
        }
      } catch (e) {
        console.error('認証初期化エラー:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();

    // 認証状態の変更を監視
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          let appUser = await getUserByAuthUid(session.user.id);
          if (!appUser && session.user.email) {
            appUser = await getUserByEmail(session.user.email);
            if (appUser) {
              await linkAuthUid(appUser.id, session.user.id);
            }
          }
          setUser(appUser || null);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ログイン処理（Supabase Auth）
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Supabase Auth ログインエラー:', error.message);
        return false;
      }
      
      // onAuthStateChange で自動的にユーザー設定される
      // 念のため直接も設定
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        let appUser = await getUserByAuthUid(session.user.id);
        if (!appUser && session.user.email) {
          appUser = await getUserByEmail(session.user.email);
          if (appUser) {
            await linkAuthUid(appUser.id, session.user.id);
          }
        }
        setUser(appUser || null);
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
      setUser(null);
    } catch (e) {
      console.error('ログアウトエラー:', e);
      setUser(null);
    }
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
