// ============================================
// Server-Side Slug Utility Functions
// ============================================

/**
 * Create URL-friendly slug from string (server-side version)
 * @param {String} text - Text to convert to slug
 * @returns {String} Slug string
 */
export function createSlug(text) {
  if (!text) return "";

  const MAX_LENGTH = 100;
  const SEPARATOR = "-";

  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, SEPARATOR)
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, SEPARATOR)
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .substring(0, MAX_LENGTH);
}

/**
 * Generate unique slug by appending number if duplicate exists
 * @param {String} baseSlug - Base slug
 * @param {Function} checkExists - Function to check if slug exists
 * @param {String} excludeId - ID to exclude from check (for updates)
 * @returns {Promise<String>} Unique slug
 */
export async function generateUniqueSlug(
  baseSlug,
  checkExists,
  excludeId = null
) {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug, excludeId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
