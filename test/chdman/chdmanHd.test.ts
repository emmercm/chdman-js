import path from 'node:path';
import os from 'node:os';
import util from 'node:util';
import fs from 'node:fs';
import ChdmanHd from '../../src/chdman/chdmanHd.js';
import ChdmanInfo from '../../src/chdman/chdmanInfo.js';
import TestUtil from '../testUtil.js';
import { CHDType } from '../../src/chdman/common.js';

// https://unix.stackexchange.com/a/33634

it('should fail on nonexistent file', async () => {
  const temporaryChd = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.chd`;
  const temporaryHd = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.hd`;

  try {
    await expect(ChdmanHd.createHd({
      inputFilename: os.devNull,
      outputFilename: temporaryChd,
    })).rejects.toBeDefined();
    await expect(ChdmanInfo.info({
      inputFilename: temporaryHd,
    })).rejects.toBeDefined();
    await expect(ChdmanHd.extractHd({
      inputFilename: temporaryChd,
      outputFilename: temporaryHd,
    })).rejects.toBeDefined();
  } finally {
    await util.promisify(fs.rm)(temporaryChd, { force: true });
  }
});

test.each([
  [path.join('test', 'fixtures', 'hd', '512.hd'), Math.ceil(512 / 2048) * 2048],
  [path.join('test', 'fixtures', 'hd', '3584.hd'), Math.ceil(3584 / 2048) * 2048],
  [path.join('test', 'fixtures', 'iso', '2048.iso'), 2048],
])('should create, info, and extract: %s', async (hd, expectedBinSize) => {
  const temporaryChd = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(hd)))}.chd`;
  const temporaryHd = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.hd`;

  try {
    await ChdmanHd.createHd({
      inputFilename: hd,
      outputFilename: temporaryChd,
      // chdman v0.263 stopped producing valid CHDs for the fixtures with default settings
      hunkSize: 512,
    });
    await expect(TestUtil.exists(temporaryChd)).resolves.toEqual(true);

    const info = await ChdmanInfo.info({
      inputFilename: temporaryChd,
    });
    expect(info.fileVersion).toBeGreaterThan(0);
    expect(info.logicalSize).toBeGreaterThan(0);
    expect(info.hunkSize).toBeGreaterThan(0);
    expect(info.totalHunks).toBeGreaterThan(0);
    expect(info.unitSize).toBeGreaterThan(0);
    expect(info.totalUnits).toBeGreaterThan(0);
    expect(info.compression.length).toBeGreaterThan(0);
    expect(info.chdSize).toBeGreaterThan(0);
    expect(info.ratio).toBeGreaterThan(0);
    expect(info.sha1).toBeTruthy();
    expect(info.dataSha1).toBeTruthy();
    expect(info.type).toEqual(CHDType.HARD_DISK);

    await ChdmanHd.extractHd({
      inputFilename: temporaryChd,
      outputFilename: temporaryHd,
    });
    await expect(TestUtil.exists(temporaryHd)).resolves.toEqual(true);
    const temporaryHdStat = await util.promisify(fs.stat)(temporaryHd);
    expect(temporaryHdStat.size).toEqual(expectedBinSize);
  } finally {
    await util.promisify(fs.rm)(temporaryChd, { force: true });
    await util.promisify(fs.rm)(temporaryHd, { force: true });
  }
});
