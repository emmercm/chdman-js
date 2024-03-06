import * as child_process from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import which from 'which';
import url from 'node:url';
import * as os from 'node:os';
import util from 'node:util';

/**
 * Find the root of the module (where package.json lives).
 */
function findRoot(filePath = url.fileURLToPath(new URL('.', import.meta.url))): string | undefined {
  const fullPath = path.join(filePath, 'package.json');
  if (fs.existsSync(fullPath)) {
    return filePath;
  }

  const parentPath = path.dirname(filePath);
  if (parentPath !== filePath) {
    return findRoot(path.dirname(filePath));
  }

  return undefined;
}

/**
 * Get the full path to chdman, if available.
 */
function getBinPath(): string | undefined {
  const rootDirectory = findRoot() ?? process.cwd();
  const prebuilt = path.join(rootDirectory, 'bin', process.platform, process.arch, 'chdman' + (process.platform === 'win32' ? '.exe' : ''));
  if (fs.existsSync(prebuilt)) {
    return prebuilt;
  }

  const resolved = which.sync('chdman', { nothrow: true });
  if (resolved) {
    return resolved;
  }

  return undefined;
}

const CHDMAN_BIN = getBinPath();

/**
 * Run chdman with some arguments.
 */
async function run(arguments_: string[]): Promise<string> {
  if (!CHDMAN_BIN) {
    throw new Error('chdman not found');
  }

  // if (process.platform === 'darwin'
  // && !fs.existsSync(path.join('Library', 'Frameworks', 'SDL2.framework'))) {
  //   throw new Error('chdman requires the SDL2 framework to be installed on macOS');
  // }

  return new Promise<string>((resolve, reject) => {
    const proc = child_process.spawn(CHDMAN_BIN, arguments_, { windowsHide: true });
    let killed = false;

    const chunks: Buffer[] = [];
    proc.stdout.on('data', (chunk) => {
      chunks.push(chunk);
    });
    proc.stderr.on('data', (chunk) => {
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

interface ChdmanInfo {
  inputFile: string,
  fileVersion: number,
  logicalSize: number,
  hunkSize: number,
  totalHunks: number,
  unitSize: number,
  totalUnits: number,
  compression: string, // TODO(cemmer): enums?
  chdSize: number,
  ratio: number,
  sha1: string,
  dataSha1: string,
  metadata: ChdmanMetadata[],
}

interface ChdmanMetadata {
  tag: string,
  index: number,
  length: number,
  data: string,
}

export default {
  /**
   * Return info about a CHD file.
   */
  async info(inputFilename: string): Promise<ChdmanInfo> {
    if (!await util.promisify(fs.exists)(inputFilename)) {
      throw new Error(`input file doesn't exist: ${inputFilename}`);
    }

    const output = await run(['info', '--input', inputFilename, '--verbose']);

    const parsedKeys = new Map<string, string>();
    for (const line of output
      .split('\n')) {
      const split = line.split(/^([^ ][^:]+): +(.+)$/);
      if (split.length === 4) {
        parsedKeys.set(split[1].toUpperCase(), split[2]);
      }
    }

    const metadata = [...output.matchAll(/metadata: +(.+)\n +(.+)/gi)]
      .map((match, index_) => {
        const tag = match[1].match(/tag='([\d a-z]+)'/i)?.at(1)?.trim() ?? '';
        const index = Number.parseInt(
          match[1].match(/index=(\d+)/i)?.at(1) ?? String(index_),
          10,
        );
        const length = Number.parseInt(
          match[1].match(/length=([\d,]+)/i)?.at(1)?.replace(/,/g, '') ?? '0',
          10,
        );
        return {
          tag,
          index,
          length,
          data: match[2],
        } satisfies ChdmanMetadata;
      });

    return {
      inputFile: parsedKeys.get('INPUT FILE') ?? inputFilename,
      fileVersion: Number.parseInt(parsedKeys.get('FILE VERSION') ?? '0', 10),
      logicalSize: Number.parseInt(parsedKeys.get('LOGICAL SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      hunkSize: Number.parseInt(parsedKeys.get('HUNK SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      totalHunks: Number.parseInt(parsedKeys.get('TOTAL HUNKS')?.replace(/\D+/g, '') ?? '0', 10),
      unitSize: Number.parseInt(parsedKeys.get('UNIT SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      totalUnits: Number.parseInt(parsedKeys.get('TOTAL UNITS')?.replace(/\D+/g, '') ?? '0', 10),
      compression: parsedKeys.get('TOTAL UNITS') ?? '',
      chdSize: Number.parseInt(parsedKeys.get('CHD SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      ratio: Number.parseFloat(parsedKeys.get('RATIO')?.replace(/[^\d.]+/g, '') ?? '0'),
      sha1: parsedKeys.get('SHA1') ?? '',
      dataSha1: parsedKeys.get('DATA SHA1') ?? '',
      metadata,
    } satisfies ChdmanInfo;
  },

  /**
   * Create a hard disk CHD.
   */
  async createHd(inputFilename: string, outputChdFilename: string): Promise<void> {
    const existedBefore = await util.promisify(fs.exists)(outputChdFilename);
    try {
      await run(['createhd', '--input', inputFilename, '--output', outputChdFilename, '--numprocessors', String(os.cpus().length)]);
    } catch (error) {
      // chdman can leave cruft when it fails
      if (!existedBefore) {
        await util.promisify(fs.rm)(outputChdFilename, { force: true });
      }
      throw error;
    }
  },

  /**
   * Create a CD CHD.
   */
  async createCd(inputFilename: string, outputChdFilename: string): Promise<void> {
    const existedBefore = await util.promisify(fs.exists)(outputChdFilename);
    try {
      await run(['createcd', '--input', inputFilename, '--output', outputChdFilename, '--numprocessors', String(os.cpus().length)]);
    } catch (error) {
      // chdman can leave cruft when it fails
      if (!existedBefore) {
        await util.promisify(fs.rm)(outputChdFilename, { force: true });
      }
      throw error;
    }
  },

  /**
   * Automatically extract a CHD.
   */
  async extract(inputChdFilename: string, outputFilename: string): Promise<string> {
    const info = await this.info(inputChdFilename);
    const metadataTags = new Set(info.metadata
      .map((metadata) => metadata.tag));

    if (metadataTags.has('CHTR') || metadataTags.has('CHT2')) {
      // CD-ROMs?
      const outputCue = `${outputFilename}.cue`;
      const outputBin = `${outputFilename}.bin`;
      await this.extractCd(inputChdFilename, outputCue, outputBin);
      return outputCue;
    }
    if (metadataTags.has('CHGD')) {
      // Dreamcast GD-ROM
      const outputGdi = `${outputFilename}.gdi`;
      await this.extractCd(inputChdFilename, outputGdi);
      return outputGdi;
    }

    if (metadataTags.has('GDDD')) {
      await this.extractHd(inputChdFilename, outputFilename);
      return outputFilename;
    }

    throw new Error('couldn\'t automatically detect CHD data type');
  },

  /**
   * Extract a CD CHD into a cue and single bin file.
   */
  async extractCd(
    inputChdFilename: string,
    outputCueFilename: string,
    outputBinFilename?: string,
  ): Promise<void> {
    await run([
      'extractcd',
      '--input', inputChdFilename,
      '--output', outputCueFilename,
      ...(outputBinFilename ? ['--outputbin', outputBinFilename] : []),
    ]);
  },

  /**
   * Extract a hard disk CHD.
   */
  async extractHd(inputChdFilename: string, outputFilename: string): Promise<void> {
    await run(['extracthd', '--input', inputChdFilename, '--output', outputFilename]);
  },
};
