import util from 'node:util';
import fs from 'node:fs';
import ChdmanBin from './chdmanBin.js';
import { CHDType, CHDCompressionAlgorithm } from './common.js';

export interface InfoOptions {
  inputFilename: string,
}

export interface CHDInfo {
  // CLI output
  inputFile: string,
  fileVersion: number,
  logicalSize: number,
  hunkSize: number,
  totalHunks: number,
  unitSize: number,
  totalUnits: number,
  compression: CHDCompressionAlgorithm[],
  chdSize: number,
  ratio: number,
  sha1: string,
  dataSha1: string,
  metadata: CHDMetadata[],
  // Derived output
  type: CHDType,
}

export interface CHDMetadata {
  tag: string,
  index: number,
  length: number,
  data: string,
}

export default {
  /**
   * Return info about a CHD file.
   */
  async info(options: InfoOptions, attempt = 1): Promise<CHDInfo> {
    if (!await util.promisify(fs.exists)(options.inputFilename)) {
      throw new Error(`input file doesn't exist: ${options.inputFilename}`);
    }

    const output = await ChdmanBin.run([
      'info',
      '--input', options.inputFilename,
      '--verbose',
    ]);

    // Try to detect failures, and then retry them automatically
    if (!output.trim() && attempt < 5) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * (2 ** (attempt - 1) * 10));
      });
      return this.info(options, attempt + 1);
    }

    const parsedKeys = new Map<string, string>();
    for (const line of output.split(/\r?\n/)) {
      const split = line.split(/^([^ ][^:]+): +(.+)$/);
      if (split.length === 4) {
        parsedKeys.set(split[1].toUpperCase(), split[2]);
      }
    }

    const metadata = [...output.matchAll(/metadata: +(.+)\r?\n +(.+)/gi)]
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
        } satisfies CHDMetadata;
      });

    const metadataTags = new Set(metadata.map((m) => m.tag));
    let type = CHDType.RAW;
    if (metadataTags.has('GDDD')) {
      type = CHDType.HARD_DISK;
    } else if (metadataTags.has('CHCD') || metadataTags.has('CHTR') || metadataTags.has('CHT2')) {
      type = CHDType.CD_ROM;
    } else if (metadataTags.has('CHGT') || metadataTags.has('CHGD')) {
      type = CHDType.GD_ROM;
    } else if (metadataTags.has('DVD')) {
      type = CHDType.DVD_ROM;
    }

    const chdInfo = {
      inputFile: parsedKeys.get('INPUT FILE') ?? options.inputFilename,
      fileVersion: Number.parseInt(parsedKeys.get('FILE VERSION') ?? '0', 10),
      logicalSize: Number.parseInt(parsedKeys.get('LOGICAL SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      hunkSize: Number.parseInt(parsedKeys.get('HUNK SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      totalHunks: Number.parseInt(parsedKeys.get('TOTAL HUNKS')?.replace(/\D+/g, '') ?? '0', 10),
      unitSize: Number.parseInt(parsedKeys.get('UNIT SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      totalUnits: Number.parseInt(parsedKeys.get('TOTAL UNITS')?.replace(/\D+/g, '') ?? '0', 10),
      compression: [...(parsedKeys.get('COMPRESSION') ?? '').matchAll(/([a-z]{4})( \([^(]+\))?/g)]
        .map((match) => match[1])
        .map((compressionType) => Object.keys(CHDCompressionAlgorithm)
          .map((enumKey) => {
            const compressionAlgo = enumKey as keyof typeof CHDCompressionAlgorithm;
            return CHDCompressionAlgorithm[compressionAlgo];
          })
          .find((enumValue) => enumValue === compressionType))
        .filter((enumValue): enumValue is CHDCompressionAlgorithm => enumValue !== undefined),
      chdSize: Number.parseInt(parsedKeys.get('CHD SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      ratio: Number.parseFloat(parsedKeys.get('RATIO')?.replace(/[^\d.]+/g, '') ?? '0'),
      sha1: parsedKeys.get('SHA1') ?? '',
      dataSha1: parsedKeys.get('DATA SHA1') ?? '',
      metadata,
      type,
    } satisfies CHDInfo;

    // Try to detect failures, and then retry them automatically
    if (chdInfo.fileVersion === 0 && attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * (2 ** (attempt - 1) * 20));
      });
      return this.info(options, attempt + 1);
    }

    return chdInfo;
  },
};
