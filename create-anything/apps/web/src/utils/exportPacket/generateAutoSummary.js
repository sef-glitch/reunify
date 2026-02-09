export function generateAutoSummary(completedItems) {
  if (completedItems.length === 0) {
    return "No tasks were completed this reporting period.";
  }

  const categories = {};
  completedItems.forEach((item) => {
    const cat = item.category || "General";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item.title);
  });

  let summary = `This week, ${completedItems.length} task${completedItems.length > 1 ? "s were" : " was"} completed. `;

  Object.entries(categories).forEach(([cat, items], idx) => {
    if (idx > 0) summary += " ";
    summary += `${cat}: ${items.join(", ")}.`;
  });

  return summary;
}
