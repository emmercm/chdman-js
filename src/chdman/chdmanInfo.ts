import util from 'node:util';
import fs from 'node:fs';
import ChdmanBin from './chdmanBin.js';
import CompressionAlgorithm from './common.js';

export interface InfoOptions {
  inputFilename: string,
}

export interface Info {
  inputFile: string,
  fileVersion: number,
  logicalSize: number,
  hunkSize: number,
  totalHunks: number,
  unitSize: number,
  totalUnits: number,
  compression: CompressionAlgorithm[],
  chdSize: number,
  ratio: number,
  sha1: string,
  dataSha1: string,
  metadata: Metadata[],
}

export interface Metadata {
  tag: string,
  index: number,
  length: number,
  data: string,
}

export default {
  /**
   * Return info about a CHD file.
   */
  async info(options: InfoOptions): Promise<Info> {
    if (!await util.promisify(fs.exists)(options.inputFilename)) {
      throw new Error(`input file doesn't exist: ${options.inputFilename}`);
    }

    const output = await ChdmanBin.run([
      'info',
      '--input', options.inputFilename,
      '--verbose',
    ]);

    const parsedKeys = new Map<string, string>();
    for (const line of output.split(/\r?\n/)) {
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
        } satisfies Metadata;
      });

    return {
      inputFile: parsedKeys.get('INPUT FILE') ?? options.inputFilename,
      fileVersion: Number.parseInt(parsedKeys.get('FILE VERSION') ?? '0', 10),
      logicalSize: Number.parseInt(parsedKeys.get('LOGICAL SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      hunkSize: Number.parseInt(parsedKeys.get('HUNK SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      totalHunks: Number.parseInt(parsedKeys.get('TOTAL HUNKS')?.replace(/\D+/g, '') ?? '0', 10),
      unitSize: Number.parseInt(parsedKeys.get('UNIT SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      totalUnits: Number.parseInt(parsedKeys.get('TOTAL UNITS')?.replace(/\D+/g, '') ?? '0', 10),
      compression: [...(parsedKeys.get('COMPRESSION') ?? '').matchAll(/([a-z]{4})( \([^(]+\))?/g)]
        .map((match) => match[1])
        .map((type) => Object.keys(CompressionAlgorithm)
          .map((enumKey) => CompressionAlgorithm[enumKey as keyof typeof CompressionAlgorithm])
          .find((enumValue) => enumValue === type))
        .filter((enumValue): enumValue is CompressionAlgorithm => enumValue !== undefined),
      chdSize: Number.parseInt(parsedKeys.get('CHD SIZE')?.replace(/\D+/g, '') ?? '0', 10),
      ratio: Number.parseFloat(parsedKeys.get('RATIO')?.replace(/[^\d.]+/g, '') ?? '0'),
      sha1: parsedKeys.get('SHA1') ?? '',
      dataSha1: parsedKeys.get('DATA SHA1') ?? '',
      metadata,
    } satisfies Info;
  },
};
