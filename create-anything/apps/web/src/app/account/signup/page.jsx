"use client";
import { useState } from "react";
import useAuth from "@/utils/useAuth";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpWithCredentials } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const result = await signUpWithCredentials({
        email,
        password,
        name: name || undefined,
        callbackUrl: "/dashboard/intake",
        redirect: true,
      });

      if (result?.error) {
        toast.error("Email already in use or invalid credentials");
        setLoading(false);
      }
      // If successful, the redirect will happen automatically
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-6 font-sans">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-sm border border-[#EAEAEA]">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-[#8B70F6] rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 font-serif">
            R
          </div>
          <h1 className="text-2xl font-serif font-medium text-[#121212]">
            Create your account
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Get started with your case management.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-all bg-[#FAFAFA] disabled:opacity-50"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-all bg-[#FAFAFA] disabled:opacity-50"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-all bg-[#FAFAFA] disabled:opacity-50"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-all bg-[#FAFAFA] disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#121212] text-white font-semibold py-3 rounded-xl hover:bg-black transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a
            href="/account/signin"
            className="text-[#8B70F6] font-medium hover:underline"
          >
            Sign In
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-start gap-2 text-xs text-gray-400 leading-tight bg-gray-50 p-3 rounded-lg">
            <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
            <p>
              This platform is for educational and organizational purposes only.
              It is not legal advice. Consult an attorney for legal guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
