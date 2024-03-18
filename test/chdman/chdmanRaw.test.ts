import path from 'node:path';
import os from 'node:os';
import util from 'node:util';
import fs from 'node:fs';
import ChdmanInfo from '../../src/chdman/chdmanInfo.js';
import TestUtil from '../testUtil.js';
import ChdmanRaw from '../../src/chdman/chdmanRaw.js';

test('should fail on nonexistent file', async () => {
  const temporaryChd = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.chd`;
  const temporaryRaw = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.hd`;

  try {
    await expect(ChdmanRaw.createRaw({
      inputFilename: os.devNull,
      outputFilename: temporaryChd,
      hunkSize: 64,
      unitSize: 64,
    })).rejects.toBeDefined();
    await expect(ChdmanInfo.info({
      inputFilename: temporaryRaw,
    })).rejects.toBeDefined();
    await expect(ChdmanRaw.extractRaw({
      inputFilename: temporaryChd,
      outputFilename: temporaryRaw,
    })).rejects.toBeDefined();
  } finally {
    await util.promisify(fs.rm)(temporaryChd, { force: true });
  }
});

test.each([
  [path.join('test', 'fixtures', 'hd', '512.hd'), 512],
  [path.join('test', 'fixtures', 'hd', '3584.hd'), 3584],
  [path.join('test', 'fixtures', 'iso', '2048.iso'), 2048],
  [path.join('test', 'fixtures', 'iso', '16384.iso'), 16_384],
])('should create, info, and extract: %s', async (hd, expectedBinSize) => {
  const temporaryChd = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(hd)))}.chd`;
  const temporaryHd = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.hd`;

  try {
    await ChdmanRaw.createRaw({
      inputFilename: hd,
      outputFilename: temporaryChd,
      hunkSize: 64,
      unitSize: 64,
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

    await ChdmanRaw.extractRaw({
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
