import fs, { PathLike } from 'node:fs';
import util from 'node:util';
import crypto from 'node:crypto';

export default {
  /**
   * Asynchronously check the existence of a file.
   */
  async exists(pathLike: PathLike): Promise<boolean> {
    try {
      await util.promisify(fs.stat)(pathLike);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Make a random file in the temporary directory.
   */
  async mktemp(prefix: string): Promise<string> {
    const randomExtension = crypto.randomBytes(4).readUInt32LE().toString(36);
    const filePath = `${prefix.replace(/\.+$/, '')}.${randomExtension}`;
    if (!await this.exists(filePath)) {
      return filePath;
    }
    return this.mktemp(prefix);
  },
};
