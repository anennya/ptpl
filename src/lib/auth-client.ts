import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, adminRole, volunteerRole, memberRole } from "./permissions";

const appURL = import.meta.env.VITE_APP_URL || "http://localhost:5173";
export const authClient = createAuthClient({
  baseURL: `${appURL}/api/auth`,
  plugins: [
    organizationClient({
      ac,
      roles: {
        admin: adminRole,
        volunteer: volunteerRole,
        member: memberRole,
      },
    }),
  ],
});
