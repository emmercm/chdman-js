import ChdmanBin from './chdmanBin.js';

export default {
  /**
   * Return info about a CHD file.
   */
  async help(attempt = 1): Promise<string> {
    const output = await ChdmanBin.run(['help']);

    // Try to detect failures, and then retry them automatically
    if (!output.trim() && attempt <= 3) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * (2 ** (attempt - 1) * 20));
      });
      return this.help(attempt + 1);
    }

    return output;
  },
};
