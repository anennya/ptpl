import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { ac, adminRole, volunteerRole, memberRole } from "./permissions";

export const authClient = createAuthClient({
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
