import util from 'node:util';
import fs from 'node:fs';
import ChdmanBin from './chdmanBin.js';
import { CHDCompressionAlgorithm } from './common.js';

export interface CreateCdOptions {
  outputFilename: string,
  outputParentFilename?: string,
  force?: boolean,
  inputFilename: string,
  hunkSize?: number,
  compression?: 'none' | CHDCompressionAlgorithm[],
  numProcessors?: number
}

export interface ExtractCdOptions {
  outputFilename: string,
  outputBinFilename?: string,
  force?: boolean,
  inputFilename: string,
  inputParentFilename?: string,
}

export default {
  /**
   * Create a CD CHD.
   */
  async createCd(options: CreateCdOptions): Promise<void> {
    const existedBefore = await util.promisify(fs.exists)(options.outputFilename);
    try {
      await ChdmanBin.run([
        'createcd',
        '--output', options.outputFilename,
        ...(options.outputParentFilename ? ['--outputparent', String(options.outputParentFilename)] : []),
        ...(options.force === true ? ['--force'] : []),
        '--input', options.inputFilename,
        ...(options.hunkSize === undefined ? [] : ['--hunksize', String(options.hunkSize)]),
        ...(options.compression === undefined
          ? []
          : ['--compression', Array.isArray(options.compression) ? options.compression.join(',') : options.compression]),
        ...(options.numProcessors === undefined ? [] : ['--numprocessors', String(options.numProcessors)]),
      ]);
    } catch (error) {
      // chdman can leave cruft when it fails
      if (!existedBefore) {
        await util.promisify(fs.rm)(options.outputFilename, { force: true });
      }
      throw error;
    }
  },

  /**
   * Extract a CD CHD.
   *
   * For BIN/CUE discs, {@link options.outputFilename} should be the `.cue` file.
   * For GDI/ISO/etc. discs, {@link options.outputFilename} should be the single file.
   */
  async extractCd(options: ExtractCdOptions): Promise<void> {
    await ChdmanBin.run([
      'extractcd',
      '--output', options.outputFilename,
      ...(options.outputBinFilename ? ['--outputbin', options.outputBinFilename] : []),
      ...(options.force === true ? ['--force'] : []),
      '--input', options.inputFilename,
      ...(options.inputParentFilename ? ['--inputparent', options.inputParentFilename] : []),
    ]);
  },
};
