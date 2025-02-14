#!/usr/bin/env node

import ChdmanBin, { ChdmanBinaryPreference } from './chdman/chdmanBin.js';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async (): Promise<void> => {
  const argv = process.argv.slice(2);

  try {
    await ChdmanBin.run(argv, {
      logStd: true,
      binaryPreference: ChdmanBinaryPreference.PREFER_BUNDLED_BINARY,
    });
  } catch {
    if (argv.at(0)?.toLowerCase() === 'help') {
      // Ignore the non-zero exit code from help messages
      return;
    }

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }
})();
