import { CheckCircle } from "lucide-react";

export function CheckboxItem({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-200">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-[#8B70F6] checked:bg-[#8B70F6]"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 peer-checked:opacity-100">
          <CheckCircle size={12} />
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}
