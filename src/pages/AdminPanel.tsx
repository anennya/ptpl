import { useState, useEffect } from "react";
import { authClient } from "../lib/auth-client";

// Define interfaces for member and invitation types
interface Member {
  id: string;
  organizationId: string;
  role: "member" | "admin" | "volunteer";
  createdAt: Date;
  userId: string;
  user: {
    email: string;
    name: string;
    image?: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt: Date;
  organizationId: string;
  role: string;
  inviterId: string;
  teamId?: string;
}

type RoleType = "admin" | "volunteer" | "member";

export default function AdminPanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleType>("volunteer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const organization = await authClient.organization.getFullOrganization(
          {},
        );
        const data = organization.data || { members: [] };
        setMembers(Array.isArray(data.members) ? data.members : []);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    const fetchInvitations = async () => {
      try {
        const invitationList = await authClient.organization.listInvitations(
          {},
        );
        const data = invitationList.data || [];
        setInvitations(data as Invitation[]);
      } catch (error) {
        console.error("Error fetching invitations:", error);
      }
    };

    fetchMembers();
    fetchInvitations();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await authClient.organization.inviteMember({
        email,
        role: role as RoleType,
      });
      setMessage(`Invitation sent to ${email} with role: ${role}`);
      setEmail("");

      // Refresh invitations list
      const invitationList = await authClient.organization.listInvitations({});
      const data = invitationList.data || [];
      setInvitations(data as Invitation[]);
    } catch (error: unknown) {
      console.error("Error inviting user:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Failed to send invitation: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await authClient.organization.cancelInvitation({
        invitationId,
      });

      // Refresh invitations list
      const invitationList = await authClient.organization.listInvitations({});
      const data = invitationList.data || [];
      setInvitations(data as Invitation[]);
    } catch (error) {
      console.error("Error canceling invitation:", error);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: RoleType) => {
    try {
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
      });

      // Refresh members list
      const organization = await authClient.organization.getFullOrganization(
        {},
      );
      const data = organization.data || { members: [] };
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      });

      // Refresh members list
      const organization = await authClient.organization.getFullOrganization(
        {},
      );
      const data = organization.data || { members: [] };
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Invite New User</h2>

        <form onSubmit={handleInviteUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="admin">Admin</option>
              <option value="volunteer">Volunteer</option>
              <option value="member">Member</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {loading ? "Sending..." : "Send Invitation"}
          </button>

          {message && (
            <div
              className={`mt-2 text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}
            >
              {message}
            </div>
          )}
        </form>
      </div>

      {/* Pending Invitations */}
      <div className="bg-white rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold p-6 border-b">
          Pending Invitations
        </h2>

        {invitations.length === 0 ? (
          <p className="p-6 text-gray-500">No pending invitations</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invitation.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invitation.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invitation.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Organization Members */}
      <div className="bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold p-6 border-b">
          Organization Members
        </h2>

        {members.length === 0 ? (
          <p className="p-6 text-gray-500">No members yet</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleUpdateRole(member.id, e.target.value as RoleType)
                      }
                      className="mr-2 text-sm border rounded"
                    >
                      <option value="admin">Admin</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="member">Member</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
