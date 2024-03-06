import crypto from 'node:crypto';
import util from 'node:util';
import fs, { PathLike } from 'node:fs';
import path from 'node:path';
import * as os from 'node:os';
import chdman from '../src/chdman.js';

/**
 * Asynchronously check the existence of a file.
 */
async function exists(pathLike: PathLike): Promise<boolean> {
  return util.promisify(fs.exists)(pathLike);
}

/**
 * Make a random file in the temporary directory.
 */
async function mktemp(prefix: string): Promise<string> {
  const randomExtension = crypto.randomBytes(4).readUInt32LE().toString(36);
  const filePath = `${prefix.replace(/\.+$/, '')}.${randomExtension}`;
  if (!await exists(filePath)) {
    return filePath;
  }
  return mktemp(prefix);
}

// https://unix.stackexchange.com/a/33634
// https://www.duckstation.org/cue-maker/

describe('HD', () => {
  test('should fail on nonexistent file', async () => {
    const temporaryChd = `${await mktemp(path.join(os.tmpdir(), 'dummy'))}.chd`;
    const temporaryHd = `${await mktemp(path.join(os.tmpdir(), 'dummy'))}.hd`;

    try {
      await expect(chdman.createHd(os.devNull, temporaryChd)).rejects.toBeTruthy();
      await expect(chdman.info(temporaryHd)).rejects.toBeTruthy();
      await expect(chdman.extractHd(temporaryChd, temporaryHd)).rejects.toBeTruthy();
    } finally {
      await util.promisify(fs.rm)(temporaryChd, { force: true });
    }
  });

  test.each([
    [path.join('test', 'fixtures', 'cue', 'small.hd'), Math.ceil(512 / 2048) * 2048],
    [path.join('test', 'fixtures', 'cue', 'large.hd'), Math.ceil(3584 / 2048) * 2048],
  ])('should create, info, and extract: %s', async (hd, expectedBinSize) => {
    const temporaryChd = `${await mktemp(path.join(os.tmpdir(), path.basename(hd)))}.chd`;
    const temporaryHd = `${await mktemp(path.join(os.tmpdir(), 'dummy'))}.hd`;

    try {
      await chdman.createHd(hd, temporaryChd);
      await expect(exists(temporaryChd)).resolves.toEqual(true);

      const info = await chdman.info(temporaryChd);
      expect(info.fileVersion).toBeGreaterThan(0);
      expect(info.logicalSize).toBeGreaterThan(0);
      expect(info.hunkSize).toBeGreaterThan(0);
      expect(info.totalHunks).toBeGreaterThan(0);
      expect(info.unitSize).toBeGreaterThan(0);
      expect(info.totalUnits).toBeGreaterThan(0);
      expect(info.compression).toBeTruthy();
      expect(info.chdSize).toBeGreaterThan(0);
      expect(info.ratio).toBeGreaterThan(0);
      expect(info.sha1).toBeTruthy();
      expect(info.dataSha1).toBeTruthy();

      await chdman.extractHd(temporaryChd, temporaryHd);
      await expect(exists(temporaryHd)).resolves.toEqual(true);
      const temporaryHdStat = await util.promisify(fs.stat)(temporaryHd);
      expect(temporaryHdStat.size).toEqual(expectedBinSize);
    } finally {
      await util.promisify(fs.rm)(temporaryChd, { force: true });
      await util.promisify(fs.rm)(temporaryHd, { force: true });
    }
  });
});

describe('CD', () => {
  test('should fail on nonexistent file', async () => {
    const temporaryChd = `${await mktemp(path.join(os.tmpdir(), 'dummy'))}.chd`;
    const temporaryCue = `${temporaryChd}.cue`;
    const temporaryBin = `${temporaryChd}.bin`;

    try {
      await expect(chdman.createCd(os.devNull, temporaryChd)).rejects.toBeTruthy();
      await expect(chdman.info(temporaryChd)).rejects.toBeTruthy();
      await expect(chdman.extractCd(temporaryChd, temporaryCue, temporaryBin)).rejects.toBeTruthy();
    } finally {
      await util.promisify(fs.rm)(temporaryChd, { force: true });
    }
  });

  test.each([
    [path.join('test', 'fixtures', 'cue', 'single.cue'), 2352],
    [path.join('test', 'fixtures', 'cue', 'multiple.cue'), Math.floor((4704 + 7056 + 3000) / 2352) * 2352],
  ])('should create, info, and extract: %s', async (cue, expectedBinSize) => {
    const temporaryChd = `${await mktemp(path.join(os.tmpdir(), path.basename(cue)))}.chd`;
    const temporaryCue = `${temporaryChd}.cue`;
    const temporaryBin = `${temporaryChd}.bin`;

    try {
      await chdman.createCd(cue, temporaryChd);
      await expect(exists(temporaryChd)).resolves.toEqual(true);

      const info = await chdman.info(temporaryChd);
      expect(info.fileVersion).toBeGreaterThan(0);
      expect(info.logicalSize).toBeGreaterThan(0);
      expect(info.hunkSize).toBeGreaterThan(0);
      expect(info.totalHunks).toBeGreaterThan(0);
      expect(info.unitSize).toBeGreaterThan(0);
      expect(info.totalUnits).toBeGreaterThan(0);
      expect(info.compression).toBeTruthy();
      expect(info.chdSize).toBeGreaterThan(0);
      expect(info.ratio).toBeGreaterThan(0);
      expect(info.sha1).toBeTruthy();
      expect(info.dataSha1).toBeTruthy();

      await chdman.extractCd(temporaryChd, temporaryCue, temporaryBin);
      await expect(exists(temporaryCue)).resolves.toEqual(true);
      const temporaryBinStat = await util.promisify(fs.stat)(temporaryBin);
      expect(temporaryBinStat.size).toEqual(expectedBinSize);
    } finally {
      await util.promisify(fs.rm)(temporaryChd, { force: true });
      await util.promisify(fs.rm)(temporaryCue, { force: true });
      await util.promisify(fs.rm)(temporaryBin, { force: true });
    }
  });
});
