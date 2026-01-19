import { CheckboxItem } from "./CheckboxItem";

export function SectionsConfig({
  includeSections,
  setIncludeSections,
  notes,
  setNotes,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Include Sections</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <CheckboxItem
          label="Case Summary"
          checked={includeSections.summary}
          onChange={(v) => setIncludeSections((s) => ({ ...s, summary: v }))}
        />
        <CheckboxItem
          label="Weekly Plan Checklist"
          checked={includeSections.checklist}
          onChange={(v) => setIncludeSections((s) => ({ ...s, checklist: v }))}
        />
        <CheckboxItem
          label="Completed Items Only"
          checked={includeSections.completedOnly}
          onChange={(v) =>
            setIncludeSections((s) => ({ ...s, completedOnly: v }))
          }
        />
        <CheckboxItem
          label="Document Index"
          checked={includeSections.uploadIndex}
          onChange={(v) =>
            setIncludeSections((s) => ({ ...s, uploadIndex: v }))
          }
        />
        <CheckboxItem
          label="Notes for Court"
          checked={includeSections.notes}
          onChange={(v) => setIncludeSections((s) => ({ ...s, notes: v }))}
        />
      </div>

      {includeSections.notes && (
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Notes / Summary
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#8B70F6] outline-none min-h-[100px]"
            placeholder="Add a personal summary or specific notes for this week..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
