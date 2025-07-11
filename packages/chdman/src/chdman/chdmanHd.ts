import util from 'node:util';
import fs from 'node:fs';
import ChdmanBin, { ChdmanRunOptions } from './chdmanBin.js';
import { CHDCompressionAlgorithm } from './common.js';
import ChdmanInfo from './chdmanInfo.js';

export interface CreateHdOptions extends ChdmanRunOptions {
  outputFilename: string,
  outputParentFilename?: string,
  force?: boolean,
  inputFilename: string,
  inputStartByte?: number,
  inputStartHunk?: number,
  inputBytes?: number,
  inputHunks?: number,
  hunkSize?: number,
  compression?: 'none' | CHDCompressionAlgorithm[],
  template?: number,
  identFilename?: string,
  cylindersHeadsSectors?: string,
  size?: number,
  sectorSize?: number,
  numProcessors?: number
}

export interface ExtractHdOptions extends ChdmanRunOptions {
  outputFilename: string,
  force?: boolean,
  inputFilename: string,
  inputParentFilename?: string,
  inputStartByte?: number,
  inputStartHunk?: number,
  inputBytes?: number,
  inputHunks?: number,
}

export default {
  /**
   * Create a hard disk CHD.
   */
  async createHd(options: CreateHdOptions): Promise<void> {
    let existedBefore: boolean;
    try {
      await util.promisify(fs.stat)(options.outputFilename);
      existedBefore = true;
    } catch {
      existedBefore = false;
    }

    try {
      await ChdmanBin.run([
        'createhd',
        '--output', options.outputFilename,
        ...(options.outputParentFilename ? ['--outputparent', String(options.outputParentFilename)] : []),
        ...(options.force === true ? ['--force'] : []),
        '--input', options.inputFilename,
        ...(options.inputStartByte === undefined ? [] : ['--inputstartbyte', String(options.inputStartByte)]),
        ...(options.inputStartHunk === undefined ? [] : ['--inputstarthunk', String(options.inputStartHunk)]),
        ...(options.inputBytes === undefined ? [] : ['--inputbytes', String(options.inputBytes)]),
        ...(options.inputHunks === undefined ? [] : ['--inputhunks', String(options.inputHunks)]),
        ...(options.hunkSize === undefined ? [] : ['--hunksize', String(options.hunkSize)]),
        ...(options.compression === undefined
          ? []
          : ['--compression', Array.isArray(options.compression) ? options.compression.join(',') : options.compression]),
        ...(options.template === undefined ? [] : ['--template', String(options.template)]),
        ...(options.identFilename === undefined ? [] : ['--ident', options.identFilename]),
        ...(options.cylindersHeadsSectors ? ['--chs', options.cylindersHeadsSectors] : []),
        ...(options.size === undefined ? [] : ['--size', String(options.size)]),
        ...(options.sectorSize === undefined ? [] : ['--sectorsize', String(options.sectorSize)]),
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
   * Extract a hard disk CHD.
   */
  async extractHd(options: ExtractHdOptions): Promise<void> {
    await ChdmanBin.run([
      'extracthd',
      '--output', options.outputFilename,
      ...(options.force === true ? ['--force'] : []),
      '--input', options.inputFilename,
      ...(options.inputParentFilename ? ['--inputparent', options.inputParentFilename] : []),
      ...(options.inputStartByte === undefined ? [] : ['--inputstartbyte', String(options.inputStartByte)]),
      ...(options.inputStartHunk === undefined ? [] : ['--inputstarthunk', String(options.inputStartHunk)]),
      ...(options.inputBytes === undefined ? [] : ['--inputbytes', String(options.inputBytes)]),
      ...(options.inputHunks === undefined ? [] : ['--inputhunks', String(options.inputHunks)]),
    ], options);
  },
};
