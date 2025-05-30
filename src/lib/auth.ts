import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { Pool } from "pg";
import { ac, adminRole, volunteerRole, memberRole } from "./permissions";
import { config } from "dotenv";

// Load environment variables
config();

// Connect to your Supabase PostgreSQL database
const pool = new Pool({
  // connectionString: process.env.VITE_SUPABASE_CONNECTION_STRING,
  // Or use individual connection parameters:
  host: process.env.SUPABASE_DB_HOST,
  port: 5432,
  database: process.env.SUPABASE_DB_NAME,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

// Create the better-auth instance
export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  // Use custom table names to match migration
  schema: {
    user: {
      modelName: "user",
    },
    session: {
      modelName: "session",
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            console.log(
              "Auth hook: Setting active organization for session creation",
              { userId: session.userId },
            );

            // Query the auth_members table to find the user's organizations
            const memberQuery = `
              SELECT am.organization_id, ao.slug
              FROM auth_members am
              JOIN auth_organizations ao ON am.organization_id = ao.id
              WHERE am.user_id = $1
              LIMIT 1
            `;

            const result = await pool.query(memberQuery, [session.userId]);

            if (result.rows.length > 0) {
              const organizationId = result.rows[0].organization_id;
              console.log("Auth hook: Found organization for user:", {
                userId: session.userId,
                organizationId,
              });

              return {
                data: {
                  ...session,
                  activeOrganizationId: organizationId,
                },
              };
            } else {
              console.log("Auth hook: No organization found for user:", {
                userId: session.userId,
              });
            }
          } catch (error) {
            console.error(
              "Auth hook: Error setting active organization:",
              error,
            );
          }

          return { data: session };
        },
      },
    },
  },
  plugins: [
    organization({
      // Custom table names for organization-related tables
      schema: {
        organization: {
          modelName: "auth_organizations",
        },
        member: {
          modelName: "auth_members", // Different from your existing "members" table
        },
        invitation: {
          modelName: "auth_invitations",
        },
      },
      ac,
      roles: {
        admin: adminRole,
        volunteer: volunteerRole,
        member: memberRole,
      },
      // Configure invitation email
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.APP_URL}/accept-invitation/${data.id}`;
        console.log(
          `INVITATION: ${data.email} invited to ${data.organization.name} as ${data.role}`,
        );
        console.log(`Invitation link: ${inviteLink}`);
        // In production, implement email sending here
        // For example with Nodemailer, SendGrid, or another email service
      },
    }),
  ],
});
