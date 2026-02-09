import { useState } from "react";
import useUser from "@/utils/useUser";
import { useExportData } from "@/hooks/useExportData";
import { useExportPacket } from "@/hooks/useExportPacket";
import { useDeleteExport } from "@/hooks/useDeleteExport";
import { PacketDetailsForm } from "@/components/ExportPacket/PacketDetailsForm";
import { SectionsConfig } from "@/components/ExportPacket/SectionsConfig";
import { DocumentSelector } from "@/components/ExportPacket/DocumentSelector";
import { ExportSummary } from "@/components/ExportPacket/ExportSummary";
import { RecentExports } from "@/components/ExportPacket/RecentExports";

export default function ExportPacketPage() {
  const { data: user } = useUser();

  // Configuration State
  const [packetTitle, setPacketTitle] = useState("Reunify Court Packet");
  const [caseNickname, setCaseNickname] = useState("");
  const [dateRange, setDateRange] = useState("30"); // 7, 30, 90, all
  const [notes, setNotes] = useState("");
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    checklist: true,
    completedOnly: false,
    uploadIndex: true,
    visitation: true,
    notes: true,
  });
  const [selectedUploadIds, setSelectedUploadIds] = useState(new Set());

  // Fetch data
  const { currentCase, filteredUploads, filteredPlanItems, previousExports } =
    useExportData(dateRange, includeSections);

  // Export and delete handlers
  const { generatePDF, isGenerating } = useExportPacket();
  const { deleteExport, deletingId } = useDeleteExport();

  const toggleUploadSelection = (id) => {
    const newSet = new Set(selectedUploadIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedUploadIds(newSet);
  };

  const handleGeneratePDF = async () => {
    await generatePDF({
      currentCase,
      packetTitle,
      caseNickname,
      user,
      filteredPlanItems,
      filteredUploads,
      selectedUploadIds,
      includeSections,
      notes,
      dateRange,
    });
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Export Court Packet
        </h1>
        <p className="text-gray-500 mt-1">
          Configure and generate a professional PDF packet for your attorney or
          caseworker.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: CONFIG */}
        <div className="lg:col-span-2 space-y-6">
          <PacketDetailsForm
            packetTitle={packetTitle}
            setPacketTitle={setPacketTitle}
            caseNickname={caseNickname}
            setCaseNickname={setCaseNickname}
          />

          <SectionsConfig
            includeSections={includeSections}
            setIncludeSections={setIncludeSections}
            notes={notes}
            setNotes={setNotes}
          />

          <DocumentSelector
            filteredUploads={filteredUploads}
            selectedUploadIds={selectedUploadIds}
            toggleUploadSelection={toggleUploadSelection}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        </div>

        {/* RIGHT COLUMN: PREVIEW & ACTION */}
        <div className="space-y-6">
          <ExportSummary
            filteredPlanItems={filteredPlanItems}
            filteredUploads={filteredUploads}
            selectedUploadIds={selectedUploadIds}
            isGenerating={isGenerating}
            currentCase={currentCase}
            onGenerate={handleGeneratePDF}
          />

          <RecentExports
            previousExports={previousExports}
            onDelete={deleteExport}
            deletingId={deletingId}
          />
        </div>
      </div>
    </div>
  );
}
