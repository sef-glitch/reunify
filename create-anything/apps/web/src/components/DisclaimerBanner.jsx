import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-100 px-6 py-2">
      <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-2 text-amber-800 text-xs md:text-sm font-medium text-center">
        <AlertTriangle size={14} className="flex-shrink-0" />
        <span>
          Not legal advice. For education and organization only. Consult with
          your attorney.
        </span>
      </div>
    </div>
  );
}
