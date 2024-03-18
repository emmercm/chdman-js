import util from 'node:util';
import fs from 'node:fs';
import { CHDCompressionAlgorithm } from './common.js';
import ChdmanBin from './chdmanBin.js';

export interface CreateRawOptions {
  outputFilename: string,
  outputParentFilename?: string,
  force?: boolean,
  inputFilename: string,
  inputStartByte?: number,
  inputStartHunk?: number,
  inputBytes?: number,
  inputHunks?: number,
  hunkSize: number,
  unitSize: number,
  compression?: 'none' | CHDCompressionAlgorithm[],
  numProcessors?: number
}

export interface ExtractRawOptions {
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
  async createRaw(options: CreateRawOptions): Promise<void> {
    const existedBefore = await util.promisify(fs.exists)(options.outputFilename);
    try {
      await ChdmanBin.run([
        'createraw',
        '--output', options.outputFilename,
        ...(options.outputParentFilename ? ['--outputparent', String(options.outputParentFilename)] : []),
        ...(options.force === true ? ['--force'] : []),
        '--input', options.inputFilename,
        ...(options.inputStartByte === undefined ? [] : ['--inputstartbyte', String(options.inputStartByte)]),
        ...(options.inputStartHunk === undefined ? [] : ['--inputstarthunk', String(options.inputStartHunk)]),
        ...(options.inputBytes === undefined ? [] : ['--inputbytes', String(options.inputBytes)]),
        ...(options.inputHunks === undefined ? [] : ['--inputhunks', String(options.inputHunks)]),
        '--hunksize', String(options.hunkSize),
        '--unitsize', String(options.unitSize),
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

  async extractRaw(options: ExtractRawOptions): Promise<void> {
    await ChdmanBin.run([
      'extractraw',
      '--output', options.outputFilename,
      ...(options.force === true ? ['--force'] : []),
      '--input', options.inputFilename,
      ...(options.inputParentFilename ? ['--inputparent', options.inputParentFilename] : []),
      ...(options.inputStartByte === undefined ? [] : ['--inputstartbyte', String(options.inputStartByte)]),
      ...(options.inputStartHunk === undefined ? [] : ['--inputstarthunk', String(options.inputStartHunk)]),
      ...(options.inputBytes === undefined ? [] : ['--inputbytes', String(options.inputBytes)]),
      ...(options.inputHunks === undefined ? [] : ['--inputhunks', String(options.inputHunks)]),
    ]);
  },
};
