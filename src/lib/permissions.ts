// ptpl/src/lib/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

// Define all possible actions for each resource
const statements = {
  ...defaultStatements, // Include default organization permissions
  books: ["view", "create", "update", "delete", "borrow", "return"],
  members: ["view", "create", "update", "delete"],
  circulation: ["manage"],
  reports: ["view", "generate"],
} as const;

// Create access control instance
export const ac = createAccessControl(statements);

// Define member role (limited permissions)
export const memberRole = ac.newRole({
  books: ["view", "borrow", "return"],
});

// Define volunteer role (more permissions)
export const volunteerRole = ac.newRole({
  books: ["view", "create", "update", "borrow", "return"],
  members: ["view"],
  circulation: ["manage"],
});

// Define admin role (full permissions)
export const adminRole = ac.newRole({
  books: ["view", "create", "update", "delete", "borrow", "return"],
  members: ["view", "create", "update", "delete"],
  circulation: ["manage"],
  reports: ["view", "generate"],
  organization: ["update"], // Can update organization settings
  member: ["create", "update", "delete"], // Can manage members
  invitation: ["create", "cancel"], // Can invite users
});
