export const EDU_DOMAINS = [
  ".edu",
  ".edu.bd",
  ".ac.uk",
  ".edu.au",
  ".ac.in",
  ".edu.cn",
  ".ac.jp",
  ".edu.sg",
];

export function isEduEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  
  // Trim and convert to lowercase to handle accidental spaces or caps
  const cleanEmail = email.trim().toLowerCase();
  
  // Basic structural validation
  if (!cleanEmail.includes("@")) return false;
  
  const parts = cleanEmail.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  
  // Check if the domain exactly matches or ends with an accepted edu domain 
  // (e.g. "university.edu" ends with ".edu", "student.university.edu" ends with ".edu")
  return EDU_DOMAINS.some((suffix) => domain === suffix.slice(1) || domain.endsWith(suffix));
}
