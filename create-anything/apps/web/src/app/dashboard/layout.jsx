import {
  Home,
  Briefcase,
  CheckSquare,
  BookOpen,
  MessageSquare,
  LogOut,
  Menu,
  X,
  User,
  Settings,
} from "lucide-react";
import DisclaimerBanner from "../../components/DisclaimerBanner";
import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOut } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Cases", href: "/dashboard/cases", icon: Briefcase },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Resources", href: "/dashboard/resources", icon: BookOpen },
    { name: "AI Assistant", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans flex flex-col">
      <DisclaimerBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* MOBILE SIDEBAR OVERLAY */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        >
          <div className="h-full flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
              <div className="w-8 h-8 bg-[#8B70F6] rounded-lg flex items-center justify-center text-white font-bold text-xl font-serif">
                R
              </div>
              <span className="ml-3 font-semibold text-lg font-serif">
                Reunify
              </span>
              <button
                className="ml-auto md:hidden text-gray-500"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#8B70F6] transition-colors group"
                >
                  <item.icon size={20} className="group-hover:text-[#8B70F6]" />
                  <span className="font-medium text-sm">{item.name}</span>
                </a>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
              >
                <LogOut size={20} />
                <span className="font-medium text-sm">Log out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* HEADER */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8">
            <button
              className="md:hidden text-gray-500 -ml-2 p-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center ml-auto gap-4">
              <div className="hidden md:block text-right">
                <div className="text-sm font-semibold text-gray-900">
                  My Account
                </div>
                <div className="text-xs text-gray-500">Case Management</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
                <User size={20} />
              </div>
            </div>
          </header>

          {/* PAGE CONTENT SCROLLABLE AREA */}
          <div className="flex-1 overflow-auto p-6 md:p-8">
            <div className="max-w-5xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
