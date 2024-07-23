import ChdmanBin from '../../src/chdman/chdmanBin.js';

it('should print the help message', async () => {
  try {
    await ChdmanBin.run(['help']);
  } catch (error) {
    // eslint-disable-next-line jest/no-conditional-expect
    expect(error).toBeTruthy();
    console.log(error);
    return;
  }
  throw new Error('help should have thrown');
});
