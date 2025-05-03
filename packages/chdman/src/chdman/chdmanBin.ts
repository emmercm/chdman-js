import which from 'which';
import util from 'node:util';
import fs from 'node:fs';
import * as child_process from 'node:child_process';

export interface ChdmanRunOptions {
  binaryPreference?: ChdmanBinaryPreference
  logStd?: boolean
}

export enum ChdmanBinaryPreference {
  PREFER_BUNDLED_BINARY = 1,
  PREFER_PATH_BINARY,
}

/**
 * Code to find and interact with the `chdman` binary.
 */
export default class ChdmanBin {
  private static CHDMAN_BIN: string | undefined;

  private static async getBinPath(
    binaryPreference?: ChdmanBinaryPreference,
  ): Promise<string | undefined> {
    if (this.CHDMAN_BIN) {
      return this.CHDMAN_BIN;
    }

    if ((binaryPreference ?? ChdmanBinaryPreference.PREFER_BUNDLED_BINARY)
      === ChdmanBinaryPreference.PREFER_BUNDLED_BINARY
    ) {
      const pathBundled = await this.getBinPathBundled();
      this.CHDMAN_BIN = pathBundled ?? (await this.getBinPathExisting());
    } else {
      const pathExisting = await this.getBinPathExisting();
      this.CHDMAN_BIN = pathExisting ?? (await this.getBinPathBundled());
    }

    return this.CHDMAN_BIN;
  }

  private static async getBinPathBundled(): Promise<string | undefined> {
    try {
      const chdman = await import(`@emmercm/chdman-${process.platform}-${process.arch}`);
      const prebuilt = chdman.default;
      try {
        await util.promisify(fs.stat)(prebuilt);
        return prebuilt;
      } catch { /* ignored */ }
    } catch { /* ignored */ }

    return undefined;
  }

  private static async getBinPathExisting(): Promise<string | undefined> {
    const resolved = await which(
      process.platform === 'win32' ? 'chdman.exe' : 'chdman',
      { nothrow: true },
    );
    if (resolved) {
      return resolved;
    }
    return undefined;
  }

  /**
   * Run chdman with some arguments.
   */
  static async run(arguments_: string[], options?: ChdmanRunOptions): Promise<string> {
    const chdmanBin = await ChdmanBin.getBinPath(options?.binaryPreference);
    if (!chdmanBin) {
      throw new Error('chdman not found');
    }

    const inputIndex = arguments_.indexOf('--input');
    if (inputIndex !== -1 && (inputIndex + 1) < arguments_.length) {
      const inputPath = arguments_[inputIndex + 1];
      try {
        await util.promisify(fs.stat)(inputPath);
      } catch {
        throw new Error(`input file doesn't exist: ${inputPath}`);
      }
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

      proc.on('close', (code) => {
        const output = Buffer.concat(chunks).toString().trim();
        if ((code !== null && code !== 0) || killed) {
          return reject(output);
        }
        return resolve(output);
      });
      proc.on('error', () => {
        const output = Buffer.concat(chunks).toString().trim();
        reject(output);
      });
    });
  }
}
