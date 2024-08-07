import ChdmanInfo from './src/chdman/chdmanInfo.js';
import ChdmanBin from './src/chdman/chdmanBin.js';
import ChdmanHd from './src/chdman/chdmanHd.js';
import ChdmanCd from './src/chdman/chdmanCd.js';
import ChdmanVerify from './src/chdman/chdmanVerify.js';
import ChdmanDvd from './src/chdman/chdmanDvd.js';
import ChdmanRaw from './src/chdman/chdmanRaw.js';
import ChdmanHelp from './src/chdman/chdmanHelp.js';

export * from './src/chdman/chdmanInfo.js';
export * from './src/chdman/chdmanHelp.js';
export * from './src/chdman/chdmanBin.js';
export * from './src/chdman/chdmanHd.js';
export * from './src/chdman/chdmanCd.js';
export * from './src/chdman/chdmanVerify.js';
export * from './src/chdman/chdmanDvd.js';
export * from './src/chdman/chdmanRaw.js';
export * from './src/chdman/common.js';

export default {
  run: ChdmanBin.run,

  help: ChdmanHelp.help,

  info: ChdmanInfo.info,

  verify: ChdmanVerify.verify,

  createRaw: ChdmanRaw.createRaw,
  createHd: ChdmanHd.createHd,
  createCd: ChdmanCd.createCd,
  createDvd: ChdmanDvd.createDvd,
  // TODO(cemmer): createld

  extractRaw: ChdmanRaw.extractRaw,
  extractHd: ChdmanHd.extractHd,
  extractCd: ChdmanCd.extractCd,
  extractDvd: ChdmanDvd.extractDvd,
  // TODO(cemmer): extractld

  // TODO(cemmer): copy

  // TODO(cemmer): addmeta
  // TODO(cemmer): delmeta
  // TODO(cemmer): dumpmeta
};
