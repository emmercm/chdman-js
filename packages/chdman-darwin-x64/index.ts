import path from 'node:path';
import url from 'node:url';

export default path.join(url.fileURLToPath(new URL('.', import.meta.url)), 'chdman');
