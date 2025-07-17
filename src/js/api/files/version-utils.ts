/**
 * Utility functions for handling version-related operations
 */

/**
 * Extracts version information from a filepath following the pattern "co.buck-tools.cep.1.0.6.zxp"
 * @param filepath - The filepath to extract version from
 * @returns An object containing the version components or null if no version found
 */
export function extractVersion(filepath: string): { major: number, minor: number, micro: number } | null {
  // Regular expression to match version pattern in the format x.y.z
  const versionRegex = /\.(\d+)\.(\d+)\.(\d+)\./;
  const match = filepath.match(versionRegex);
  
  if (match && match.length === 4) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      micro: parseInt(match[3], 10)
    };
  }
  
  return null;
}

/**
 * Compares two version objects
 * @param a - First version object
 * @param b - Second version object
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
function compareVersions(
  a: { major: number, minor: number, micro: number }, 
  b: { major: number, minor: number, micro: number }
): number {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.micro - b.micro;
}

/**
 * Sorts an array of filepaths by their version numbers
 * @param filepaths - Array of filepaths to sort
 * @param ascending - Whether to sort in ascending order (default: true)
 * @returns Sorted array of filepaths
 */
export function sortByVersion(filepaths: string[], ascending: boolean = true): string[] {
  return [...filepaths].sort((a, b) => {
    const versionA = extractVersion(a);
    const versionB = extractVersion(b);
    
    // Handle cases where version extraction fails
    if (!versionA && !versionB) return 0;
    if (!versionA) return ascending ? 1 : -1;
    if (!versionB) return ascending ? -1 : 1;
    
    const comparison = compareVersions(versionA, versionB);
    return ascending ? comparison : -comparison;
  });
}

/**
 * Gets the latest version from an array of filepaths
 * @param filepaths - Array of filepaths to analyze
 * @returns The filepath with the highest version or null if no valid filepaths
 */
export function getLatestVersion(filepaths: string[]): string | null {
  const sorted = sortByVersion(filepaths, false); // Sort in descending order
  return sorted.length > 0 ? sorted[0] : null;
}
