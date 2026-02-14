/**
 * Creates a page URL for navigation
 * In local development with react-router-dom, this simply returns the path
 */
export function createPageUrl(pageName) {
  // Convert page name to lowercase path
  // e.g., "Home" -> "/home", "AdminDashboard" -> "/admindashboard"
  return `/${pageName.toLowerCase()}`;
}