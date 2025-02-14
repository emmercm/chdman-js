import util from 'node:util';
import fs from 'node:fs';
import ChdmanBin, { ChdmanRunOptions } from './chdmanBin.js';
import { CHDCompressionAlgorithm } from './common.js';
import ChdmanInfo from './chdmanInfo.js';

export interface CreateDvdOptions extends ChdmanRunOptions {
  outputFilename: string,
  outputParentFilename?: string,
  force?: boolean,
  inputFilename: string,
  compression?: 'none' | CHDCompressionAlgorithm[],
  numProcessors?: number
}

export interface ExtractDvdOptions extends ChdmanRunOptions {
  outputFilename: string,
  outputBinFilename?: string,
  force?: boolean,
  inputFilename: string,
  inputParentFilename?: string,
}

export default {
  /**
   * Create a DVD CHD.
   */
  async createDvd(options: CreateDvdOptions): Promise<void> {
    const existedBefore = await util.promisify(fs.exists)(options.outputFilename);
    try {
      await ChdmanBin.run([
        'createdvd',
        '--output', options.outputFilename,
        ...(options.outputParentFilename ? ['--outputparent', String(options.outputParentFilename)] : []),
        ...(options.force === true ? ['--force'] : []),
        '--input', options.inputFilename,
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
   * Extract a DVD CHD.
   */
  async extractDvd(options: ExtractDvdOptions): Promise<void> {
    await ChdmanBin.run([
      'extractdvd',
      '--output', options.outputFilename,
      ...(options.outputBinFilename ? ['--outputbin', options.outputBinFilename] : []),
      ...(options.force === true ? ['--force'] : []),
      '--input', options.inputFilename,
      ...(options.inputParentFilename ? ['--inputparent', options.inputParentFilename] : []),
    ], options);
  },
};
