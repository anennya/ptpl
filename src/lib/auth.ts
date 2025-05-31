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
