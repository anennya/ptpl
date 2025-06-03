import { supabase } from "../lib/supabase";

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
}

export interface AuthError {
  message: string;
}

// Authentication functions
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("Session error:", error);
    // Clear potentially corrupted session
    await supabase.auth.signOut();
    throw error;
  }
  return session;
}

// Updated getUser function in auth.ts
export async function getUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;

    if (!user) return null;

    // Get user's organization and role with better error handling
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows

    if (memberError) {
      console.warn("Failed to fetch user organization data:", memberError);
      // Continue without organization data rather than failing
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email,
      role: member?.role || "member",
      organizationId: member?.organization_id,
    };
  } catch (error) {
    console.error("Error in getUser:", error);
    throw error;
  }
}

export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw error;
}

// Organization and role management
export async function getUserOrganizations() {
  const user = await getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      organization_id,
      role,
      organizations (
        id,
        name,
        description,
        created_at
      )
    `,
    )
    .eq("user_id", user.id);

  if (error) throw error;
  return data;
}

export async function createOrganization(name: string, description?: string) {
  const user = await getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      description,
      created_by: user.id,
    })
    .select()
    .single();

  if (orgError) throw orgError;

  // Add user as admin of the organization
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "admin",
    });

  if (memberError) throw memberError;
  return org;
}

export async function addMember(
  organizationId: string,
  email: string,
  role: string = "member",
) {
  const { data, error } = await supabase.functions.invoke("auth-api", {
    body: {
      action: "addMember",
      organizationId,
      email,
      role,
    },
  });

  if (error) throw error;
  return data;
}

export async function hasRole(
  organizationId: string,
  requiredRole: string,
): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return false;

  const roleHierarchy = ["member", "volunteer", "admin"];
  const userRoleIndex = roleHierarchy.indexOf(data.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}

export async function canPerformAction(
  resource: string,
  action: string,
): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("auth-api", {
    body: {
      action: "checkPermission",
      resource,
      permission: action,
    },
  });

  if (error) {
    console.error("Permission check failed:", error);
    return false;
  }

  return data?.hasPermission || false;
}

// Auth state change listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_, session) => {
    if (session?.user) {
      // Don't make async calls in the auth state change handler
      // Instead, just pass basic user info and let the caller fetch full user data
      callback({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email!,
      });
    } else {
      callback(null);
    }
  });
}
