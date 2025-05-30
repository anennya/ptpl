import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function AcceptInvitation() {
  const { id: invitationId } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const invitationData = await authClient.organization.getInvitation({
          query: { id: invitationId },
        });
        setInvitation(invitationData);
      } catch (error) {
        console.error("Error fetching invitation:", error);
        setError("Invalid or expired invitation");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [invitationId]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await authClient.organization.acceptInvitation({
        invitationId,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setError("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading invitation...</div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Invitation Not Found</h2>
        <p>The invitation may have expired or been cancelled.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Library Invitation</h2>
      <p className="mb-4">
        You have been invited to join the Prestige Tranquility Library as a{" "}
        <strong>{invitation.role}</strong>.
      </p>
      <p className="mb-6">
        Email: <strong>{invitation.email}</strong>
      </p>

      <div className="flex space-x-4">
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {accepting ? "Accepting..." : "Accept Invitation"}
        </button>

        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
