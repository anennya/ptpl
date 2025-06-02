// supabase/functions/auth-api/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface RequestBody {
  action?: string;
  organizationId?: string;
  email?: string;
  role?: string;
  actionType?: string;
  resource?: string;
  [key: string]: unknown;
}

interface RolePermissions {
  [role: string]: {
    can: string[];
  };
}

const rolePermissions: RolePermissions = {
  admin: {
    can: ["read:*", "write:*", "delete:*"],
  },
  volunteer: {
    can: ["read:*", "write:books", "write:members"],
  },
  member: {
    can: ["read:books", "read:events"],
  },
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use built-in Supabase environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Extract the JWT token from the Authorization header
    const authHeader = req.headers.get("Authorization");

    // Create client with anon key for user operations
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader || "",
        },
      },
    });

    // Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let body: RequestBody = {};
    try {
      const requestText = await req.text();
      if (requestText) {
        body = JSON.parse(requestText);
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { action } = body;

    switch (action) {
      case "add_member":
        return await handleAddMember(body, supabase, supabaseAdmin);
      case "check_permission":
        return await handleCheckPermission(body, supabase);
      case "get_user_organizations":
        return await handleGetUserOrganizations(supabase);
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action", providedAction: action }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    console.error("Function error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleAddMember(
  body: RequestBody,
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient,
): Promise<Response> {
  const { organizationId, email, role } = body;

  if (!organizationId || !email || !role) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if current user is admin of the organization
  const { data: adminCheck, error: adminError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", authData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (adminError || !adminCheck) {
    return new Response(
      JSON.stringify({ error: "Forbidden - Admin role required" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Look for existing user by email
  const { data: userData, error: userListError } =
    await supabaseAdmin.auth.admin.listUsers();

  const userToAdd = userData?.users?.find((u: any) => u.email === email);

  if (userListError || !userToAdd) {
    return new Response(
      JSON.stringify({ message: "User not found - invitation would be sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Add user to organization
  const { data: memberData, error } = await supabaseAdmin
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      user_id: userToAdd.id,
      role,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(memberData), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCheckPermission(
  body: RequestBody,
  supabase: SupabaseClient,
): Promise<Response> {
  const { organizationId, actionType, resource } = body;

  if (!organizationId || !actionType || !resource) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return new Response(
      JSON.stringify({ allowed: false, reason: "Not authenticated" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Get user's role in the organization
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return new Response(
      JSON.stringify({
        allowed: false,
        reason: "Not a member of this organization",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const role = membership.role as string;
  const permissions = rolePermissions[role]?.can || [];

  const hasPermission =
    permissions.includes(`${actionType}:*`) ||
    permissions.includes(`${actionType}:${resource}`);

  return new Response(JSON.stringify({ allowed: hasPermission }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGetUserOrganizations(
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        role,
        organizations (
          id,
          name,
          created_at
        )
      `,
      )
      .eq("user_id", authData.user.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in handleGetUserOrganizations:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
