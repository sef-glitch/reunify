import { Download } from "lucide-react";

export function ExportSummary({
  filteredPlanItems,
  filteredUploads,
  selectedUploadIds,
  isGenerating,
  currentCase,
  onGenerate,
}) {
  return (
    <div className="bg-[#121212] text-white p-6 rounded-2xl shadow-xl sticky top-6">
      <h3 className="font-semibold mb-6">Ready to Export?</h3>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Items to Include</span>
          <span className="text-white font-medium">
            {filteredPlanItems.length}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Documents Indexed</span>
          <span className="text-white font-medium">
            {filteredUploads.length}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Documents Embedded</span>
          <span className="text-white font-medium">
            {selectedUploadIds.size}
          </span>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !currentCase}
        className="w-full bg-[#8B70F6] hover:bg-[#7A67F5] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#8B70F6]/20"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download size={18} />
            Generate & Download PDF
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
        This will generate a PDF, download it to your device, and save a copy in
        your secure Document Vault.
      </p>
    </div>
  );
}
