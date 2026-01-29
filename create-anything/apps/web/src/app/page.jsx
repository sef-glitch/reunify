import {
  Play,
  Shield,
  FileText,
  Calendar,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#121212] font-sans">
      {/* HEADER */}
      <header className="px-6 h-20 flex items-center justify-between border-b border-[#E0E0E0] bg-white sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#8B70F6] rounded-lg flex items-center justify-center text-white font-bold text-xl font-serif">
              R
            </div>
            <span className="font-semibold text-lg tracking-tight font-serif">
              Reunify
            </span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              How it works
            </a>
            <a
              href="#resources"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              Resources
            </a>
          </nav>
          <div className="flex gap-4">
            <a href="/account/signin">
              <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors">
                Log in
              </button>
            </a>
            <a href="/dashboard/intake">
              <button className="px-5 py-2.5 rounded-xl bg-[#8B70F6] text-white text-sm font-semibold hover:bg-[#7A67F5] transition-colors shadow-sm">
                Get Started
              </button>
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0EEFF] text-[#8B70F6] text-xs font-semibold mb-8 border border-[#E0D9FF]">
            <span className="w-2 h-2 rounded-full bg-[#8B70F6]"></span>
            For Families Across the U.S.
          </div>

          <h1
            className="text-5xl md:text-7xl font-normal leading-[1.1] mb-8 text-[#121212]"
            style={{ fontFamily: "Instrument Serif, serif" }}
          >
            Organize your case.
            <br />
            <em className="italic text-[#8B70F6]">Reunify</em> your family.
          </h1>

          <p className="text-xl text-gray-600 max-w-[600px] mx-auto mb-12 leading-relaxed font-light">
            A simple tool for parents in CPS/family court cases to track action
            plans, upload proof, and generate court-ready packets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/dashboard/intake">
              <button className="px-8 py-4 rounded-2xl bg-[#121212] text-white font-semibold text-lg hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-200">
                Start Your Action Plan
              </button>
            </a>
            <a href="#how-it-works" className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white border border-gray-200 font-semibold text-lg hover:border-gray-300 transition-all text-[#121212]">
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-gray-400">
                <Play size={10} className="ml-0.5 opacity-60" />
              </div>
              How it works
            </a>
          </div>

          <div className="mt-12 inline-block bg-amber-50 border border-amber-100 px-4 py-2 rounded-lg">
            <p className="text-xs text-amber-800 font-medium">
              <span className="font-bold">Disclaimer:</span> Not legal advice.
              For education and organization only.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="py-24 bg-white px-6 border-t border-gray-100"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-[#121212] mb-4">
              Everything you need to stay on track
            </h2>
            <p className="text-gray-500">
              Simple tools designed specifically for reunification plans.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="text-[#8B70F6]" />}
              title="Weekly Action Plans"
              description="Get a clear checklist of court-ordered services, parenting time, and appointments. Never miss a deadline."
            />
            <FeatureCard
              icon={<Shield className="text-[#8B70F6]" />}
              title="Secure Document Vault"
              description="Upload and organize certificates, drug screens, and support letters. Keep everything safe and accessible."
            />
            <FeatureCard
              icon={<FileText className="text-[#8B70F6]" />}
              title="One-Click Court Packet"
              description="Export a professional PDF summary of your progress to share with your lawyer or caseworker instantly."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-[#FAF9F7]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif text-[#121212] mb-6 leading-tight">
                From overwhelmed to{" "}
                <span className="text-[#8B70F6] italic">organized</span> in
                minutes.
              </h2>
              <div className="space-y-8 mt-10">
                <Step
                  number="01"
                  title="Complete Intake"
                  description="Answer a few questions about your case plan and services."
                />
                <Step
                  number="02"
                  title="Track Weekly Progress"
                  description="Check off tasks and upload proof as you go."
                />
                <Step
                  number="03"
                  title="Export & Share"
                  description="Generate a clean report for your next court hearing."
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 rotate-1">
              {/* Mock UI for weekly plan */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-sm text-gray-900">
                    Weekly Progress
                  </span>
                  <span className="text-xs font-medium text-[#8B70F6] bg-[#F0EEFF] px-2 py-1 rounded-md">
                    Week 4
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle size={12} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium">Parenting Class</div>
                      <div className="text-[10px] text-gray-400">
                        Completed Tuesday
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>
                    <div className="flex-1">
                      <div className="text-xs font-medium">Drug Screen</div>
                      <div className="text-[10px] text-gray-400">
                        Due Friday
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#8B70F6] w-[65%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-12 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#121212] rounded flex items-center justify-center text-white font-bold text-xs font-serif">
              R
            </div>
            <span className="font-bold text-sm tracking-tight font-serif">
              Reunify
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            &copy; 2026 Reunify. Built for families across the U.S.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 rounded-3xl bg-[#F9F9F9] border border-[#F0F0F0] hover:border-[#E0E0E0] transition-colors group cursor-default">
      <div className="w-12 h-12 bg-white rounded-2xl border border-[#EAEAEA] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 font-serif">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="font-serif text-2xl text-[#8B70F6] opacity-50 font-medium">
        {number}
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  );
}
