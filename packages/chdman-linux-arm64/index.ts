import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

/**
 * Search for a {@link fileName} in {@link filePath} or any of its parent directories.
 */
function scanUpPathForFile(filePath: string, fileName: string): string | undefined {
  const fullPath = path.join(filePath, fileName);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  const parentPath = path.dirname(filePath);
  if (parentPath !== filePath) {
    return scanUpPathForFile(path.dirname(filePath), fileName);
  }

  return undefined;
}

export default scanUpPathForFile(
  url.fileURLToPath(new URL('.', import.meta.url)),
  'chdman',
);
