import path from 'node:path';
import os from 'node:os';
import util from 'node:util';
import fs from 'node:fs';
import crypto from 'node:crypto';
import ChdmanInfo from '../../src/chdman/chdmanInfo.js';
import TestUtil from '../testUtil.js';
import ChdmanDvd from '../../src/chdman/chdmanDvd.js';
import { CHDType } from '../../src/chdman/common.js';

// https://unix.stackexchange.com/a/33634

it('should fail on nonexistent file', async () => {
  const temporaryChd = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.chd`;
  const temporaryIso = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.iso`;

  try {
    await expect(ChdmanDvd.createDvd({
      inputFilename: os.devNull,
      outputFilename: temporaryChd,
    })).rejects.toBeDefined();
    await expect(ChdmanInfo.info({
      inputFilename: temporaryIso,
    })).rejects.toBeDefined();
    await expect(ChdmanDvd.createDvd({
      inputFilename: temporaryChd,
      outputFilename: temporaryIso,
    })).rejects.toBeDefined();
  } finally {
    await util.promisify(fs.rm)(temporaryChd, { force: true });
  }
});

test.each([
  [path.join('test', 'fixtures', 'iso', '2048.iso')],
  [path.join('test', 'fixtures', 'iso', '16384.iso')],
])('should create, info, and extract: %s', async (iso) => {
  const temporaryChd = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(iso)))}.chd`;
  const temporaryIso = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.hd`;

  try {
    await ChdmanDvd.createDvd({
      inputFilename: iso,
      outputFilename: temporaryChd,
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
    expect(info.type).toEqual(CHDType.DVD_ROM);

    await ChdmanDvd.extractDvd({
      inputFilename: temporaryChd,
      outputFilename: temporaryIso,
    });
    await expect(TestUtil.exists(temporaryIso)).resolves.toEqual(true);
    expect(crypto.createHash('sha1').update(await util.promisify(fs.readFile)(iso)).digest('hex'))
      .toEqual(crypto.createHash('sha1').update(await util.promisify(fs.readFile)(temporaryIso)).digest('hex'));
  } finally {
    await util.promisify(fs.rm)(temporaryChd, { force: true });
    await util.promisify(fs.rm)(temporaryIso, { force: true });
  }
});
