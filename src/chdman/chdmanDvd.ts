import util from 'node:util';
import fs from 'node:fs';
import ChdmanBin from './chdmanBin.js';
import { CHDCompressionAlgorithm } from './common.js';

export interface CreateDvdOptions {
  outputFilename: string,
  outputParentFilename?: string,
  force?: boolean,
  inputFilename: string,
  compression?: 'none' | CHDCompressionAlgorithm[],
  numProcessors?: number
}

export interface ExtractDvdOptions {
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
    ]);
  },
};
