import { useState, useRef, useEffect } from "react";
import {
  Upload,
  File,
  Search,
  Filter,
  FileText,
  Loader2,
  ArrowLeft,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUpload } from "@/utils/useUpload";
import { filterVaultUploads } from "@/utils/vaultFilter";
import { toast } from "sonner";
import { format } from "date-fns";

const VAULT_TAGS = [
  "court docs",
  "services",
  "drug screens",
  "housing",
  "employment",
  "visitation",
  "other",
];

export default function DocumentVaultPage() {
  const queryClient = useQueryClient();
  const [planItemId, setPlanItemId] = useState(null);
  const [filterTag, setFilterTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTag, setSelectedTag] = useState(VAULT_TAGS[0]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setPlanItemId(params.get("planItemId"));
    }
  }, []);

  const fileInputRef = useRef(null);
  const [uploadFile, { loading: uploadLoading }] = useUpload();

  // 1. Fetch User's Case
  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      if (!res.ok) throw new Error("Failed to fetch cases");
      return res.json();
    },
  });

  const currentCase = cases && cases.length > 0 ? cases[0] : null;

  // 2. Fetch Uploads
  const { data: uploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ["uploads", currentCase?.id],
    queryFn: async () => {
      const res = await fetch(`/api/uploads?caseId=${currentCase.id}`);
      if (!res.ok) throw new Error("Failed to fetch uploads");
      return res.json();
    },
    enabled: !!currentCase?.id,
  });

  // 3. Fetch specific Plan Item if planItemId exists
  const { data: planItem } = useQuery({
    queryKey: ["plan-item", planItemId],
    queryFn: async () => {
      if (!currentCase || !planItemId) return null;
      // We assume we can filter from the plan-items list for now
      const res = await fetch(`/api/plan-items?caseId=${currentCase.id}`);
      if (!res.ok) return null;
      const items = await res.json();
      return items.find((i) => i.id === parseInt(planItemId));
    },
    enabled: !!currentCase?.id && !!planItemId,
  });

  // 4. Save Upload Metadata Mutation
  const saveUpload = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save upload");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads", currentCase?.id] });
      toast.success(
        planItemId
          ? "Proof uploaded for task"
          : "Document uploaded successfully",
      );
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedTag(VAULT_TAGS[0]);
    },
    onError: () => {
      toast.error("Failed to save document record");
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentCase) {
      toast.error("No active case found. Please complete intake first.");
      return;
    }

    setSelectedFile(file);
    setIsUploadModalOpen(true);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !currentCase) return;

    try {
      const { url, error } = await uploadFile({ file: selectedFile });
      if (error) throw new Error(error);

      saveUpload.mutate({
        case_id: currentCase.id,
        file_url: url,
        tag: selectedTag,
        plan_item_id: planItemId ? parseInt(planItemId) : null,
      });
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    }
  };

  // Filter uploads by tag and search query
  const filteredUploads = filterVaultUploads(uploads, filterTag, searchQuery);

  if (casesLoading)
    return (
      <div className="p-8 text-center text-gray-500">Loading vault...</div>
    );

  if (!currentCase) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-serif font-medium text-gray-900 mb-2">
          Document Vault Locked
        </h2>
        <p className="text-gray-500 mb-8">
          Please complete your case intake to start storing documents.
        </p>
        <a href="/dashboard/intake">
          <button className="bg-[#121212] text-white font-medium px-6 py-3 rounded-xl">
            Go to Intake
          </button>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          {planItemId && (
            <a
              href="/dashboard/plan"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Plan
            </a>
          )}
          <h1 className="text-3xl font-serif font-medium text-gray-900">
            Document Vault
          </h1>
          <p className="text-gray-500 mt-1">
            Securely store your completion certificates, receipts, and court
            documents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading || saveUpload.isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium shadow-sm disabled:opacity-70 ${
              planItemId
                ? "bg-[#8B70F6] hover:bg-[#7859F4] text-white ring-4 ring-[#8B70F6]/20"
                : "bg-[#121212] text-white hover:bg-black"
            }`}
          >
            {uploadLoading || saveUpload.isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Upload size={20} />
            )}
            {planItemId ? "Upload Proof Now" : "Upload Document"}
          </button>
        </div>
      </div>

      {planItem && (
        <div className="mb-8 p-4 bg-[#F0EEFF] border border-[#E0DAFD] rounded-xl flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg text-[#8B70F6]">
            <UploadCloud size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[#8B70F6]">
              Uploading proof for: {planItem.title}
            </h3>
            <p className="text-sm text-[#6E6E6E] mt-0.5">
              {planItem.instructions}
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B70F6]/50"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#8B70F6]/50 text-gray-700"
          >
            <option value="All">All Documents</option>
            {VAULT_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {uploadsLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading documents...
          </div>
        ) : filteredUploads?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No documents found
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? `No documents matching "${searchQuery}"${filterTag !== "All" ? ` in ${filterTag}` : ""}.`
                : filterTag !== "All"
                  ? `No documents found with tag "${filterTag}".`
                  : "Upload photos of certificates, receipts, or letters to keep them safe for court."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUploads.map((file) => (
                <tr
                  key={file.id}
                  className={`group hover:bg-gray-50 transition-colors ${
                    file.plan_item_id ===
                    (planItemId ? parseInt(planItemId) : -1)
                      ? "bg-[#F0EEFF] hover:bg-[#E5E0FD]"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F0EEFF] flex items-center justify-center text-[#8B70F6]">
                        <File size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {file.file_url.split("/").pop() || "Document"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {file.plan_item_id ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2
                                size={10}
                                className="text-[#8B70F6]"
                              />
                              Linked to Task
                            </span>
                          ) : (
                            "General Upload"
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {file.tag || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(file.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <Search size={18} />
                      </button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Upload Document
              </h3>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              {/* Privacy Warning */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <AlertCircle
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                  size={18}
                />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Privacy Warning:</span> Don’t
                  upload anything you’re not comfortable storing online. Use
                  minimal personal info where possible.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 text-[#8B70F6]">
                  <FileText size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-gray-900 truncate">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Category
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B70F6]/50 appearance-none"
              >
                {VAULT_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploadLoading || saveUpload.isPending}
                className="flex-1 px-4 py-3 bg-[#121212] text-white font-medium rounded-xl hover:bg-black transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {(uploadLoading || saveUpload.isPending) && (
                  <Loader2 className="animate-spin" size={18} />
                )}
                Confirm Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
