import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useDeleteExport() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const deleteExport = async (id) => {
    if (!confirm("Are you sure you want to delete this exported packet?"))
      return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/uploads?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setDeletingId(null);
    }
  };

  return { deleteExport, deletingId };
}
