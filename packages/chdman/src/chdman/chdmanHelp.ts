import ChdmanBin, { ChdmanRunOptions } from './chdmanBin.js';

export interface HelpOptions extends ChdmanRunOptions {}

export default {
  /**
   * Returns the chdman help message.
   */
  async help(options?: HelpOptions, attempt = 1): Promise<string> {
    const output = await ChdmanBin.run(['help']);

    // Try to detect failures, and then retry them automatically
    if (!output.trim() && attempt <= 3) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * (2 ** (attempt - 1) * 20));
      });
      return this.help(options, attempt + 1);
    }

    return output;
  },
};
