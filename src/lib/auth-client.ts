import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, adminRole, volunteerRole, memberRole } from "./permissions";

export const authClient = createAuthClient({
  baseURL: "http://localhost:5173/api/auth",
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
