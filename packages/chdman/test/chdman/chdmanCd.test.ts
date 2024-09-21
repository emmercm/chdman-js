import path from 'node:path';
import os from 'node:os';
import util from 'node:util';
import fs from 'node:fs';
import ChdmanCd from '../../src/chdman/chdmanCd.js';
import ChdmanInfo from '../../src/chdman/chdmanInfo.js';
import TestUtil from '../testUtil.js';
import { CHDType } from '../../src/chdman/common.js';

// import {jest} from '@jest/globals';
// jest.unstable_mockModule(`chdman-${process.platform}-${process.arch}`, () => {
//   const i = 0;
// });

it('should fail on nonexistent file', async () => {
  const temporaryChd = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.chd`;
  const temporaryCue = `${temporaryChd}.cue`;
  const temporaryBin = `${temporaryChd}.bin`;

  try {
    await expect(ChdmanCd.createCd({
      inputFilename: os.devNull,
      outputFilename: temporaryChd,
    })).rejects.toBeTruthy();
    await expect(ChdmanInfo.info({
      inputFilename: temporaryChd,
    })).rejects.toBeTruthy();
    await expect(ChdmanCd.extractCd({
      inputFilename: temporaryChd,
      outputFilename: temporaryCue,
      outputBinFilename: temporaryBin,
    })).rejects.toBeTruthy();
  } finally {
    await util.promisify(fs.rm)(temporaryChd, { force: true });
  }
});

test.each([
  [path.join('test', 'fixtures', 'cue', 'single.cue'), undefined, 2352],
  [path.join('test', 'fixtures', 'cue', 'multiple.cue'), 14_688, Math.floor((4704 + 7056 + 3000) / 2352) * 2352],
])('should create, info, and extract: %s', async (cue, hunkSize, expectedBinSize) => {
  const temporaryChd = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(cue)))}.chd`;
  const temporaryCue = `${temporaryChd}.cue`;
  const temporaryBin = `${temporaryChd}.bin`;

  try {
    await ChdmanCd.createCd({
      inputFilename: cue,
      outputFilename: temporaryChd,
      // chdman v0.263 stopped producing valid CHDs for the fixtures with default settings
      hunkSize,
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
    expect(info.type).toEqual(CHDType.CD_ROM);

    await ChdmanCd.extractCd({
      inputFilename: temporaryChd,
      outputFilename: temporaryCue,
      outputBinFilename: temporaryBin,
    });
    await expect(TestUtil.exists(temporaryCue)).resolves.toEqual(true);
    const temporaryBinStat = await util.promisify(fs.stat)(temporaryBin);
    expect(temporaryBinStat.size).toEqual(expectedBinSize);
  } finally {
    await util.promisify(fs.rm)(temporaryChd, { force: true });
    await util.promisify(fs.rm)(temporaryCue, { force: true });
    await util.promisify(fs.rm)(temporaryBin, { force: true });
  }
});
