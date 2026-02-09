"use client";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  useEffect(() => {
    // Redirect to the actual signin page
    window.location.href = "/account/signin";
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-6">
      <div className="text-center">
        <Loader2
          className="animate-spin text-[#8B70F6] mx-auto mb-4"
          size={48}
        />
        <p className="text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
