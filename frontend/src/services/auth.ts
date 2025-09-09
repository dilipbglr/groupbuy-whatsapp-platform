// frontend/src/services/auth.ts - DEBUG VERSION
import { createClient } from '@supabase/supabase-js'

// DEBUG: Let's see what's actually happening
console.log('🔍 DEBUG: All environment variables:', import.meta.env)
console.log('🔍 DEBUG: VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('🔍 DEBUG: VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 DEBUG: supabaseUrl variable:', supabaseUrl)
console.log('🔍 DEBUG: supabaseAnonKey exists:', !!supabaseAnonKey)

// This is line 4 where the error occurs
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function loginWithEmail(email: string, password: string) {
  console.log('🔐 Starting login process for:', email);
  
  try {
    // Step 1: Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Auth error:', error.message);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user returned from authentication');
    }

    console.log('✅ Authentication successful for:', data.user.email);

    // Step 2: Prepare profile data
    const profileData = { 
      id: data.user.id, 
      email: data.user.email, 
      updated_at: new Date().toISOString(),
      phone_number: data.user.phone || '',
      name: data.user.user_metadata?.name || null,
      is_admin: data.user.user_metadata?.is_admin || false
    };
    
    console.log('📝 Upsert payload (detailed):', JSON.stringify(profileData, null, 2));

    // Step 3: Enhanced upsert with detailed error logging
    try {
      console.log('🔄 Attempting upsert to profiles table...');
      
      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select(); // ✅ CRITICAL: Added .select() to fix select=*:1 issue

      if (upsertError) {
        // ✅ ENHANCED: Detailed error logging
        console.error('⚠️ Profile upsert error (DETAILED):', {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          fullError: upsertError
        });
        
        // Log common error interpretations
        if (upsertError.code === '42P01') {
          console.error('💡 DIAGNOSIS: Table "profiles" does not exist');
        } else if (upsertError.code === '42501') {
          console.error('💡 DIAGNOSIS: Permission denied - check RLS policies');
        } else if (upsertError.code === '23505') {
          console.error('💡 DIAGNOSIS: Unique constraint violation');
        } else if (upsertError.code === '42703') {
          console.error('💡 DIAGNOSIS: Column does not exist');
        }
        
        // Continue login even if upsert fails
        console.warn('⚠️ Continuing login despite profile upsert failure');
      } else {
        console.log('✅ Profile upsert successful:', upsertData);
      }
      
    } catch (profileException: any) {
      console.error('⚠️ Profile upsert exception:', {
        name: profileException.name,
        message: profileException.message,
        stack: profileException.stack
      });
    }

    console.log('🎉 Login process completed successfully');
    
    return {
      success: true,
      user: data.user,
      session: data.session,
    };
    
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

// 🚪 Logout
export async function logout() {
  console.log('🚪 Logging out...');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
  console.log('✅ Logout successful');
}

// 🧠 Get Current User + Profile
export async function getCurrentUserWithProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    console.log('👤 Fetching profile for user:', user.id);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('⚠️ Profile fetch error:', profileError);
      return { user, profile: null };
    }

    return { user, profile };
    
  } catch (error) {
    console.error('❌ Error getting user with profile:', error);
    return null;
  }
}