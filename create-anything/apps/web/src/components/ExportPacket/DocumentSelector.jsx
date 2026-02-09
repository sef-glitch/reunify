import { CheckCircle, ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

export function DocumentSelector({
  filteredUploads,
  selectedUploadIds,
  toggleUploadSelection,
  dateRange,
  setDateRange,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Embed Documents</h3>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="text-sm border-none bg-gray-50 rounded-lg px-2 py-1 text-gray-600 focus:ring-0"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Select documents to append as full pages in the PDF (Images work best).
      </p>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {filteredUploads.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            No documents found in this range.
          </div>
        ) : (
          filteredUploads.map((file) => (
            <div
              key={file.id}
              className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedUploadIds.has(file.id) ? "border-[#8B70F6] bg-[#8B70F6]/5" : "border-gray-100 hover:border-gray-200"}`}
              onClick={() => toggleUploadSelection(file.id)}
            >
              <div
                className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${selectedUploadIds.has(file.id) ? "bg-[#8B70F6] border-[#8B70F6]" : "border-gray-300"}`}
              >
                {selectedUploadIds.has(file.id) && (
                  <CheckCircle size={14} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {file.tag}
                  </span>
                  {file.file_url.match(/\.(jpeg|jpg|png|webp)$/i) && (
                    <ImageIcon size={14} className="text-gray-400" />
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {format(parseISO(file.created_at), "MMM d, yyyy")} •{" "}
                  {file.file_url.split("/").pop()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
