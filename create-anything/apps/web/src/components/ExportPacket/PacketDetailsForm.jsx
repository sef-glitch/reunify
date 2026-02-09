import { FileText } from "lucide-react";

export function PacketDetailsForm({
  packetTitle,
  setPacketTitle,
  caseNickname,
  setCaseNickname,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText size={18} className="text-[#8B70F6]" />
        Packet Details
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Packet Title
          </label>
          <input
            type="text"
            value={packetTitle}
            onChange={(e) => setPacketTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#8B70F6] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Case Nickname (Optional)
          </label>
          <input
            type="text"
            value={caseNickname}
            placeholder="e.g. Smith Family"
            onChange={(e) => setCaseNickname(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#8B70F6] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
