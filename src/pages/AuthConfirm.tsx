import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);

  const type = searchParams.get("type");
  const invitationId = searchParams.get("invitation_id");

  const handleInvitationAcceptance = async () => {
    try {
      console.log("🔄 Starting invitation acceptance for ID:", invitationId);

      const { data, error } = await supabase.functions.invoke("auth-api", {
        body: {
          action: "acceptInvitation",
          invitationId,
        },
      });

      console.log("📦 Function response:", { data, error });

      if (error) throw error;

      console.log("✅ Invitation accepted successfully");
      setSuccess(
        "Invitation accepted successfully! Redirecting to dashboard...",
      );
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error("❌ Error accepting invitation:", err);
      setError("Failed to accept invitation. Please try again.");
    } finally {
      setLoading(false);
      setSettingPassword(false);
    }
  };

  useEffect(() => {
    const checkForErrors = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get("error");
      const errorDescription = hashParams.get("error_description");

      if (error) {
        if (
          error === "access_denied" &&
          errorDescription?.includes("expired")
        ) {
          setError(
            "The invitation link has expired or already been used. Please contact an admin for a new invitation.",
          );
        } else {
          setError(`Authentication error: ${errorDescription || error}`);
        }
        setLoading(false);
        return true;
      }
      return false;
    };

    // Check for auth errors first
    if (checkForErrors()) {
      return;
    }

    // Check current session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // User is authenticated - for invites, show password form, otherwise accept invitation
        if (type === "invite" && invitationId) {
          setNeedsPassword(true);
        } else {
          setSuccess("Email confirmed successfully!");
          setTimeout(() => navigate("/dashboard"), 2000);
        }
      } else {
        setError(
          "Unable to verify your email. The link may have expired. Please contact an admin for a new invitation.",
        );
      }
      setLoading(false);
    };

    checkSession();
  }, [type, invitationId, navigate]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    console.log("🔥 handlePasswordSubmit called!");
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setSettingPassword(true);
    setError("");

    try {
      console.log("🔑 About to call updateUser");
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });
      console.log("🔑 updateUser completed, error:", updateError);

      if (updateError) throw updateError;

      console.log(
        "🔑 Password updated successfully, type:",
        type,
        "invitationId:",
        invitationId,
      );

      if (type === "invite" && invitationId) {
        console.log("🔑 About to call handleInvitationAcceptance");
        await handleInvitationAcceptance();
        console.log("🔑 handleInvitationAcceptance completed");
      } else {
        setSuccess("Password set successfully! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (err) {
      console.error("Error setting password:", err);
      setError("Failed to set password. Please try again.");
    } finally {
      setSettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Confirming your email...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Set Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {type === "invite"
                ? "Complete your invitation by setting a password"
                : "Please set a password for your account"}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={settingPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {settingPassword ? "Setting password..." : "Set Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {success ? (
            <>
              <div className="mx-auto h-12 w-12 text-green-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Success!
              </h2>
              <p className="mt-2 text-sm text-gray-600">{success}</p>
            </>
          ) : (
            <>
              <div className="mx-auto h-12 w-12 text-red-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Error</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
