import { useQuery } from "@tanstack/react-query";
import { subDays, isAfter, parseISO } from "date-fns";

export function useExportData(dateRange, includeSections) {
  // Fetch cases
  const { data: cases } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      if (!res.ok) throw new Error("Failed to fetch cases");
      return res.json();
    },
  });
  const currentCase = cases && cases.length > 0 ? cases[0] : null;

  // Fetch plan items
  const { data: planItems } = useQuery({
    queryKey: ["plan-items", currentCase?.id],
    queryFn: async () => {
      if (!currentCase) return [];
      const res = await fetch(`/api/plan-items?caseId=${currentCase.id}`);
      return res.json();
    },
    enabled: !!currentCase,
  });

  // Fetch uploads
  const { data: uploads } = useQuery({
    queryKey: ["uploads", currentCase?.id],
    queryFn: async () => {
      if (!currentCase) return [];
      const res = await fetch(`/api/uploads?caseId=${currentCase.id}`);
      return res.json();
    },
    enabled: !!currentCase,
  });

  // Filtered Data
  const filteredUploads =
    uploads?.filter((file) => {
      if (dateRange === "all") return true;
      const dateLimit = subDays(new Date(), parseInt(dateRange));
      return isAfter(parseISO(file.created_at), dateLimit);
    }) || [];

  const filteredPlanItems =
    planItems?.filter((item) => {
      if (includeSections.completedOnly && item.status !== "completed")
        return false;
      return true;
    }) || [];

  const completedTasks =
    planItems?.filter((i) => i.status === "completed") || [];

  const previousExports =
    uploads?.filter((u) => u.tag === "exported_packet") || [];

  return {
    currentCase,
    planItems,
    uploads,
    filteredUploads,
    filteredPlanItems,
    completedTasks,
    previousExports,
  };
}
