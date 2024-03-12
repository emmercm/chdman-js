import ChdmanInfo from './src/chdman/chdmanInfo.js';
import ChdmanBin from './src/chdman/chdmanBin.js';
import ChdmanHd from './src/chdman/chdmanHd.js';
import ChdmanCd from './src/chdman/chdmanCd.js';
import ChdmanVerify from './src/chdman/chdmanVerify.js';

export default {
  run: ChdmanBin.run,

  info: ChdmanInfo.info,

  verify: ChdmanVerify.verify,

  // TODO(cemmer): createraw
  createHd: ChdmanHd.createHd,
  createCd: ChdmanCd.createCd,
  // TODO(cemmer): createdvd
  // TODO(cemmer): createld

  /**
   * Automatically extract a CHD.
   */
  async extract(inputChdFilename: string, outputFilename: string): Promise<string> {
    const info = await this.info({ inputFilename: inputChdFilename });
    const metadataTags = new Set(info.metadata
      .map((metadata) => metadata.tag));

    if (metadataTags.has('GDDD')) {
      await this.extractHd({
        inputFilename: inputChdFilename,
        outputFilename,
      });
      return outputFilename;
    }

    if (metadataTags.has('CHCD') || metadataTags.has('CHTR') || metadataTags.has('CHT2')) {
      // CD-ROMs
      const outputCue = `${outputFilename}.cue`;
      const outputBin = `${outputFilename}.bin`;
      await this.extractCd({
        inputFilename: inputChdFilename,
        outputFilename: outputCue,
        outputBinFilename: outputBin,
      });
      return outputCue;
    }
    if (metadataTags.has('CHGT') || metadataTags.has('CHGD')) {
      // Dreamcast GD-ROM
      const outputGdi = `${outputFilename}.gdi`;
      await this.extractCd({
        inputFilename: inputChdFilename,
        outputFilename: outputGdi,
      });
      return outputGdi;
    }

    throw new Error('couldn\'t automatically detect CHD data type');
  },

  // TODO(cemmer): extractraw
  extractHd: ChdmanHd.extractHd,
  extractCd: ChdmanCd.extractCd,
  // TODO(cemmer): extractdvd
  // TODO(cemmer): extractld

  // TODO(cemmer): copy

  // TODO(cemmer): addmeta
  // TODO(cemmer): delmeta
  // TODO(cemmer): dumpmeta
};
