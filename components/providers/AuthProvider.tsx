'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: any | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => { },
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        console.log('AuthProvider: Fetching profile for', userId)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (mounted) {
          if (error) {
            console.warn('AuthProvider: fetchProfile error', error)
          } else {
            console.log('AuthProvider: Profile fetched', data)
            setProfile(data)
          }
        }
      } catch (e) {
        console.error('AuthProvider: fetchProfile exception', e)
      }
    }

    const initAuth = async () => {
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession()

      if (mounted) {
        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id)
        }
        setLoading(false)
      }

      // Listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;

        console.log('AuthProvider: Auth state changed', event)
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        // Only fetch profile if user changed or on initial sign in
        // (Simplification: just fetch if we have a user, basic caching could be added but this is safer)
        if (currentSession?.user) {
          // Verify if we already have the correct profile to avoid refetch?
          // For now, refetching ensures role updates are caught on login
          await fetchProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      })

      return subscription
    }

    let authSubscription: { unsubscribe: () => void } | undefined;

    initAuth().then(sub => {
      authSubscription = sub;
    });

    return () => {
      mounted = false
      if (authSubscription) authSubscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Memoize value to prevent unnecessary re-renders of consumers
  const value = {
    session,
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
    signOut,
  }

  // Debug log for renders (can remove later)
  // console.log("AuthProvider Render, loading:", loading, "isAdmin:", value.isAdmin);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
