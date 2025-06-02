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
  permission?: string;
  memberId?: string;
  invitationId?: string;
  [key: string]: unknown;
}

interface RolePermissions {
  [role: string]: {
    can: string[];
  };
}

interface Invitation {
  id: string;
  email: string;
  organization_id: string;
  role: string;
  status: string;
  expires_at: string;
  invited_by: string;
}

interface AuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    organization_id?: string;
    [key: string]: unknown;
  };
}

interface ListUsersResponse {
  users?: AuthUser[];
}

interface TransformedMember {
  id: string;
  organizationId: string;
  role: string;
  createdAt: string;
  userId: string;
  user: {
    email: string;
    name: string;
    image?: string;
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
      case "addMember":
        return await handleAddMember(body, supabase, supabaseAdmin);
      case "check_permission":
      case "checkPermission":
        return await handleCheckPermission(body, supabase);
      case "get_user_organizations":
      case "getUserOrganizations":
        return await handleGetUserOrganizations(supabase);
      case "getOrganization":
        return await handleGetOrganization(supabase, supabaseAdmin);
      case "listInvitations":
        return await handleListInvitations(supabase);
      case "inviteMember":
        return await handleInviteMember(body, supabase, supabaseAdmin);
      case "cancelInvitation":
        return await handleCancelInvitation(body, supabase, supabaseAdmin);
      case "updateMemberRole":
        return await handleUpdateMemberRole(body, supabase);
      case "removeMember":
        return await handleRemoveMember(body, supabase);
      case "getInvitation":
        return await handleGetInvitation(body, supabase);
      case "acceptInvitation":
        return await handleAcceptInvitation(body, supabase);
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

async function getCurrentUser(supabase: SupabaseClient) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    throw new Error("Unauthorized");
  }

  return authData.user;
}

async function getCurrentUserOrganization(supabase: SupabaseClient) {
  const user = await getCurrentUser(supabase);

  // First, get the user's membership (take the first one if multiple exist)
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (memberError) {
    console.error("getCurrentUserOrganization membership error:", memberError);
    throw new Error("Error fetching user membership");
  }

  if (!membership) {
    console.error(
      "getCurrentUserOrganization: No membership found for user:",
      user.id,
    );
    throw new Error("User is not a member of any organization");
  }

  // Then get the organization details
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, created_at")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (orgError) {
    console.error("getCurrentUserOrganization org error:", orgError);
    throw new Error("Error fetching organization details");
  }

  if (!organization) {
    console.error(
      "getCurrentUserOrganization: Organization not found:",
      membership.organization_id,
    );
    throw new Error("Organization not found");
  }

  return {
    organizationId: membership.organization_id,
    role: membership.role,
    organization: organization,
  };
}

async function handleGetOrganization(
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient,
): Promise<Response> {
  try {
    await getCurrentUser(supabase);
    const userOrg = await getCurrentUserOrganization(supabase);

    // Get organization members
    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select("id, organization_id, role, created_at, user_id")
      .eq("organization_id", userOrg.organizationId);

    if (membersError) {
      throw membersError;
    }

    // Get user details for each member
    const transformedMembers: TransformedMember[] = [];
    if (members) {
      for (const member of members) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
          member.user_id,
        );

        transformedMembers.push({
          id: member.id,
          organizationId: member.organization_id,
          role: member.role,
          createdAt: member.created_at,
          userId: member.user_id,
          user: {
            email: userData?.user?.email || "Unknown",
            name:
              userData?.user?.user_metadata?.name ||
              userData?.user?.email ||
              "Unknown",
            image: userData?.user?.user_metadata?.avatar_url,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        ...userOrg.organization,
        members: transformedMembers,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in handleGetOrganization:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleListInvitations(
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    await getCurrentUser(supabase);
    const userOrg = await getCurrentUserOrganization(supabase);

    const { data: invitations, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("organization_id", userOrg.organizationId)
      .eq("status", "pending");

    if (error) {
      throw error;
    }

    // Transform to match expected format
    const transformedInvitations =
      invitations?.map((inv: Invitation) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        expiresAt: inv.expires_at,
        organizationId: inv.organization_id,
        role: inv.role,
        inviterId: inv.invited_by,
      })) || [];

    return new Response(JSON.stringify(transformedInvitations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleListInvitations:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleInviteMember(
  body: RequestBody,
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient,
): Promise<Response> {
  try {
    const { email, role } = body;

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Missing email or role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await getCurrentUser(supabase);
    const userOrg = await getCurrentUserOrganization(supabase);

    // Check if user is admin
    if (userOrg.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if email is already a member of the organization
    const { data: listUsersResponse, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return new Response(JSON.stringify({ error: "Failed to lookup user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingUser = (listUsersResponse as ListUsersResponse)?.users?.find(
      (u: AuthUser) => u.email === email,
    );

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", userOrg.organizationId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMember) {
        return new Response(
          JSON.stringify({ error: "User is already a member" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Create invitation record in database for tracking
    const { data: invitation, error } = await supabase
      .from("invitations")
      .insert({
        email,
        organization_id: userOrg.organizationId,
        role,
        invited_by: user.id,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send invitation via Supabase Auth
    const { error: authError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          organization_id: userOrg.organizationId,
          role: role,
          invited_by: user.id,
          invitation_id: invitation.id,
        },
        redirectTo: `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/auth/confirm?type=invite&invitation_id=${invitation.id}`,
      });

    if (authError) {
      throw authError;
    }

    return new Response(JSON.stringify({ success: true, invitation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleInviteMember:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleCancelInvitation(
  body: RequestBody,
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient,
): Promise<Response> {
  try {
    const { invitationId } = body;

    if (!invitationId) {
      return new Response(JSON.stringify({ error: "Missing invitationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await getCurrentUser(supabase);
    const userOrg = await getCurrentUserOrganization(supabase);

    // Check if user is admin
    if (userOrg.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the invitation to find the email
    const { data: invitationData, error: fetchError } = await supabase
      .from("invitations")
      .select("email")
      .eq("id", invitationId)
      .eq("organization_id", userOrg.organizationId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Cancel the Supabase Auth invitation
    try {
      // Get the user by email to find their auth record
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(
        (u: AuthUser) =>
          u.email === invitationData.email &&
          u.email_confirmed_at === null &&
          // Check if this user was created as an invitation (has our metadata)
          u.user_metadata?.organization_id === userOrg.organizationId,
      );

      if (authUser) {
        // This is specifically our invitation - safe to delete
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      }
    } catch (authError) {
      console.error("Error canceling auth invitation:", authError);
      // Continue with database update even if auth cancellation fails
    }

    // Update the invitation status in database
    const { error } = await supabase
      .from("invitations")
      .update({ status: "canceled" })
      .eq("id", invitationId)
      .eq("organization_id", userOrg.organizationId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleCancelInvitation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleUpdateMemberRole(
  body: RequestBody,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    const { memberId, role } = body;

    if (!memberId || !role) {
      return new Response(
        JSON.stringify({ error: "Missing memberId or role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await getCurrentUser(supabase);
    const userOrg = await getCurrentUserOrganization(supabase);

    // Check if user is admin
    if (userOrg.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("id", memberId)
      .eq("organization_id", userOrg.organizationId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleUpdateMemberRole:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleRemoveMember(
  body: RequestBody,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    const { memberId } = body;

    if (!memberId) {
      return new Response(JSON.stringify({ error: "Missing memberId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await getCurrentUser(supabase);
    const userOrg = await getCurrentUserOrganization(supabase);

    // Check if user is admin
    if (userOrg.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId)
      .eq("organization_id", userOrg.organizationId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleRemoveMember:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

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

  const userToAdd = (userData as ListUsersResponse)?.users?.find(
    (u: AuthUser) => u.email === email,
  );

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
  const { organizationId, actionType, resource, permission } = body;
  const checkAction = actionType || permission;

  if (!organizationId || !checkAction || !resource) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return new Response(
      JSON.stringify({ hasPermission: false, reason: "Not authenticated" }),
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
        hasPermission: false,
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
    permissions.includes(`${checkAction}:*`) ||
    permissions.includes(`${checkAction}:${resource}`);

  return new Response(JSON.stringify({ hasPermission }), {
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

async function handleGetInvitation(
  body: RequestBody,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    const { invitationId } = body;

    if (!invitationId) {
      return new Response(JSON.stringify({ error: "Missing invitationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invitation, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("status", "pending")
      .single();

    if (error || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation not found or expired" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const transformedInvitation = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationId: invitation.organization_id,
    };

    return new Response(JSON.stringify(transformedInvitation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleGetInvitation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleAcceptInvitation(
  body: RequestBody,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    const { invitationId } = body;

    if (!invitationId) {
      return new Response(JSON.stringify({ error: "Missing invitationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await getCurrentUser(supabase);

    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation not found or expired" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (user.email !== invitation.email) {
      return new Response(
        JSON.stringify({ error: "Email mismatch" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", invitation.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      });

    if (memberError) {
      throw memberError;
    }

    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handleAcceptInvitation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
