import path from 'node:path';
import url from 'node:url';

const armVersion = (process.config.variables as { arm_version?: number }).arm_version ?? '7';
export default path.join(url.fileURLToPath(new URL('.', import.meta.url)), 'chdman-armv' + armVersion);
