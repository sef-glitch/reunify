import { Clock, FileText, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export function RecentExports({ previousExports, onDelete, deletingId }) {
  if (previousExports.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock size={16} className="text-gray-400" />
        Recent Exports
      </h3>
      <div className="space-y-3">
        {previousExports.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
          >
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 flex-1 min-w-0 hover:text-[#8B70F6] transition-colors"
            >
              <div className="bg-white p-2 rounded border border-gray-200 text-red-500">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  Court Packet
                </div>
                <div className="text-xs text-gray-500">
                  {format(parseISO(file.created_at), "MMM d, h:mm a")}
                </div>
              </div>
            </a>
            <button
              onClick={() => onDelete(file.id)}
              disabled={deletingId === file.id}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
