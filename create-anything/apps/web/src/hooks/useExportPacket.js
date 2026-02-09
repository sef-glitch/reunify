import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import useUpload from "@/utils/useUpload";
import { generateHTML } from "@/utils/exportPacket/generateHTML";
import { generateAutoSummary } from "@/utils/exportPacket/generateAutoSummary";

export function useExportPacket() {
  const [upload, { loading: uploadLoading }] = useUpload();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async ({
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
  }) => {
    if (!currentCase) return;
    setIsGenerating(true);

    try {
      // Generate auto-summary from completed items
      const completedThisWeek = filteredPlanItems.filter(
        (i) => i.status === "completed",
      );
      const autoSummary = generateAutoSummary(completedThisWeek);

      // 1. Construct HTML
      const htmlContent = generateHTML({
        title: packetTitle,
        nickname: caseNickname || "Family Case",
        user,
        currentCase,
        planItems: filteredPlanItems,
        uploads: filteredUploads,
        selectedUploadIds,
        includeSections,
        notes,
        autoSummary,
        dateRange,
      });

      // 2. Call PDF Generation API
      const response = await fetch("/integrations/pdf-generation/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { html: htmlContent },
          styles: [], // Styles are inline/in-style-tag
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();

      // 3. Trigger Download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${packetTitle.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 4. Upload to storage and save record
      const file = new File([blob], "packet.pdf", { type: "application/pdf" });
      const uploadRes = await upload({ file });

      if (uploadRes.url) {
        await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case_id: currentCase.id,
            plan_item_id: null,
            file_url: uploadRes.url,
            tag: "exported_packet",
          }),
        });
        queryClient.invalidateQueries({ queryKey: ["uploads"] });
      }
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePDF, isGenerating };
}
