import ChdmanBin, { ChdmanRunOptions } from './chdmanBin.js';

export interface VerifyOptions extends ChdmanRunOptions {
  inputFilename: string,
  inputParentFilename?: string,
}

export default {
  async verify(options: VerifyOptions): Promise<boolean> {
    try {
      await ChdmanBin.run([
        'verify',
        '--input', options.inputFilename,
        ...(options.inputParentFilename ? ['--inputparent', options.inputParentFilename] : []),
      ], options);
      return true;
    } catch {
      return false;
    }
  },
};
