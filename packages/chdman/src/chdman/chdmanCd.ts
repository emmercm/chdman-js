import util from 'node:util';
import fs from 'node:fs';
import ChdmanBin, { ChdmanRunOptions } from './chdmanBin.js';
import { CHDCompressionAlgorithm } from './common.js';
import ChdmanInfo from './chdmanInfo.js';

export interface CreateCdOptions extends ChdmanRunOptions {
  outputFilename: string,
  outputParentFilename?: string,
  force?: boolean,
  inputFilename: string,
  hunkSize?: number,
  compression?: 'none' | CHDCompressionAlgorithm[],
  numProcessors?: number
}

export interface ExtractCdOptions extends ChdmanRunOptions {
  outputFilename: string,
  outputBinFilename?: string,
  splitBin?: boolean, // added in v0.265 (https://github.com/mamedev/mame/commit/79c1ae350d07b2c7516e4d2652453cb955067814)
  force?: boolean,
  inputFilename: string,
  inputParentFilename?: string,
}

export default {
  /**
   * Create a CD CHD.
   */
  async createCd(options: CreateCdOptions): Promise<void> {
    let existedBefore: boolean;
    try {
      await util.promisify(fs.stat)(options.outputFilename);
      existedBefore = true;
    } catch {
      existedBefore = false;
    }

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
      ], options);
    } catch (error) {
      // chdman can leave cruft when it fails
      if (!existedBefore) {
        await util.promisify(fs.rm)(options.outputFilename, { force: true });
      }
      throw error;
    }

    // Test the created file
    try {
      await ChdmanInfo.info({
        inputFilename: options.outputFilename,
      });
    } catch (error) {
      throw new Error(`created CHD is invalid: ${error}`);
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
      ...(options.splitBin ? ['--splitbin'] : []),
      ...(options.force === true ? ['--force'] : []),
      '--input', options.inputFilename,
      ...(options.inputParentFilename ? ['--inputparent', options.inputParentFilename] : []),
    ], options);
  },
};
