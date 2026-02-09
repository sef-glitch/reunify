"use client";
import { User, Bell, LogOut } from "lucide-react";
import useAuth from "@/utils/useAuth";
import useUser from "@/utils/useUser";

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { data: user } = useUser();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-serif font-medium text-gray-900">
        Settings
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User size={20} className="text-gray-400" /> Profile
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 text-gray-900">{user?.email || "—"}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-gray-400" /> Notifications
          </h2>
        </div>
        <div className="p-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              defaultChecked
            />
            <span className="text-gray-700">
              Email me about upcoming tasks and hearings
            </span>
          </label>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full p-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <LogOut size={20} /> Sign Out
      </button>
    </div>
  );
}
