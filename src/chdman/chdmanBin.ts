import which from 'which';
import path from 'node:path';
import util from 'node:util';
import fs from 'node:fs';
import url from 'node:url';
import * as child_process from 'node:child_process';

export interface ChdmanBinOptions {
  logStd?: boolean
}

/**
 * Code to find and interact with the `chdman` binary.
 */
export default class ChdmanBin {
  private static CHDMAN_BIN: string | undefined;

  private static async findRoot(filePath = url.fileURLToPath(new URL('.', import.meta.url))): Promise<string | undefined> {
    const fullPath = path.join(filePath, 'package.json');
    if (await util.promisify(fs.exists)(fullPath)) {
      return filePath;
    }

    const parentPath = path.dirname(filePath);
    if (parentPath !== filePath) {
      return this.findRoot(path.dirname(filePath));
    }

    return undefined;
  }

  static async getBinPath(): Promise<string | undefined> {
    if (ChdmanBin.CHDMAN_BIN) {
      return ChdmanBin.CHDMAN_BIN;
    }

    const resolved = await which('chdman', { nothrow: true });
    if (resolved) {
      ChdmanBin.CHDMAN_BIN = resolved;
      return resolved;
    }

    const rootDirectory = await this.findRoot() ?? process.cwd();
    const prebuilt = path.join(rootDirectory, 'bin', process.platform, process.arch, `chdman${process.platform === 'win32' ? '.exe' : ''}`);
    if (await util.promisify(fs.exists)(prebuilt)) {
      ChdmanBin.CHDMAN_BIN = prebuilt;
      return prebuilt;
    }

    return undefined;
  }

  /**
   * Run chdman with some arguments.
   */
  static async run(arguments_: string[], options?: ChdmanBinOptions): Promise<string> {
    const chdmanBin = await ChdmanBin.getBinPath();
    if (!chdmanBin) {
      throw new Error('chdman not found');
    }

    // if (process.platform === 'darwin'
    // && !fs.existsSync(path.join('Library', 'Frameworks', 'SDL2.framework'))) {
    //   throw new Error('chdman requires the SDL2 framework to be installed on macOS');
    // }

    return new Promise<string>((resolve, reject) => {
      const proc = child_process.spawn(chdmanBin, arguments_, { windowsHide: true });
      let killed = false;

      const chunks: Buffer[] = [];

      proc.stdout.on('data', (chunk) => {
        if (options?.logStd) {
          console.log(chunk.toString());
        }

        chunks.push(chunk);
      });

      proc.stderr.on('data', (chunk) => {
        if (options?.logStd) {
          console.error(chunk.toString());
        }

        chunks.push(chunk);
        if (chunk.toString().includes('nan% complete')) {
          // chdman can hang forever on input files that aren't valid (i.e. too small)
          proc.kill();
          killed = true;
        }
      });

      proc.on('exit', (code) => {
        const output = Buffer.concat(chunks).toString();
        if ((code !== null && code !== 0) || killed) {
          return reject(output);
        }
        return resolve(output);
      });
      proc.on('error', reject);
    });
  }
}
