/**
 * Vault document filtering utilities
 *
 * Filters uploads by tag and search query with null-safe handling.
 */

/**
 * Safely extracts filename from a URL
 * @param {string|null|undefined} url - The file URL
 * @returns {string} The filename or empty string
 */
export function extractFileName(url) {
  const safeUrl = url ?? "";
  return safeUrl.split("/").pop() ?? "";
}

/**
 * Filters vault uploads by tag and search query
 *
 * @param {Array|null|undefined} uploads - Array of upload objects
 * @param {string} filterTag - Tag to filter by, or "All" for no tag filter
 * @param {string} searchQuery - Search query to match against filename and tag
 * @returns {Array} Filtered array of uploads (never null/undefined)
 */
export function filterVaultUploads(uploads, filterTag, searchQuery) {
  if (!uploads || !Array.isArray(uploads)) {
    return [];
  }

  return uploads.filter((upload) => {
    if (!upload) return false;

    // Filter by tag (handle null/undefined tag)
    const uploadTag = upload.tag ?? "";
    const matchesTag = filterTag === "All" || uploadTag === filterTag;

    // Filter by search query (search in filename and tag)
    const query = (searchQuery ?? "").toLowerCase().trim();
    if (!query) return matchesTag;

    // Safely extract filename from URL, handling null/undefined
    const fileName = extractFileName(upload.file_url).toLowerCase();
    const tag = uploadTag.toLowerCase();
    const matchesSearch = fileName.includes(query) || tag.includes(query);

    return matchesTag && matchesSearch;
  });
}

export default filterVaultUploads;
