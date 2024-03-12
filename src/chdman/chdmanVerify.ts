import ChdmanBin from './chdmanBin.js';

export interface VerifyOptions {
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
      ]);
      return true;
    } catch {
      return false;
    }
  },
};
