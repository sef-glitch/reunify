"use client";
import { useEffect } from "react";
import useAuth from "@/utils/useAuth";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    };

    performLogout();
  }, [signOut]);

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-6">
      <div className="text-center">
        <Loader2
          className="animate-spin text-[#8B70F6] mx-auto mb-4"
          size={48}
        />
        <h2 className="text-xl font-medium text-gray-900">
          Signing you out...
        </h2>
      </div>
    </div>
  );
}
