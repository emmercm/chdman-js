<h1 align="center">💿️ chdman</h1>

<p align="center"><b>Pre-compiled binaries and Node.js wrapper for MAME's <a href="https://docs.mamedev.org/tools/chdman.html">chdman</a> tool.</b></p>

<p align="center">
  <a href="https://www.npmjs.com/package/chdman"><img alt="npm: version" src="https://img.shields.io/npm/v/chdman?color=%23cc3534&label=version&logo=npm&logoColor=white"></a>
  <a href="https://www.npmjs.com/package/chdman"><img alt="npm: downloads" src="https://img.shields.io/npm/dt/chdman?color=%23cc3534&logo=npm&logoColor=white"></a>
  <a href="https://github.com/emmercm/chdman-js"><img alt="GitHub: stars" src="https://img.shields.io/github/stars/emmercm/chdman-js?style=flat&logo=github&logoColor=white&color=%236e5494"></a>
  <a href="https://github.com/emmercm/chdman-js/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/github/license/emmercm/chdman-js?color=blue"></a>
</p>

## Supported platforms

| OS      | Architectures                                                                 | Additional Instructions                                                                                                                                                                               |
|---------|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Windows | <ul><li>x64</li><li>x86</li></ul>                                             |                                                                                                                                                                                                       |
| macOS   | <ul><li>arm64 (Apple Silicon)</li><li>x64 (Intel)</li></ul>                   |                                                                                                                                                                                                       |
| Linux   | <ul><li>x64</li><li>x86</li><li>arm (armhf)</li><li>arm64 (aarch64)</li></ul> | [SDL2](https://www.libsdl.org/) is required to be installed separately:<ul><li>Debian: `apt-get install libsdl2-2.0-0`</li><li>Gentoo: `emerge libsdl2`</li><li>Red Hat: `dnf install SDL2`</li></ul> |

## Running

You can easily run the `chdman` binary for your OS from the command line like this:

```shell
npx chdman [command] [options..]
```

Examples:

```shell
npx chdman help
npx chdman info --input Image.chd
npx chdman createcd --input Disc.cue --output Disc.chd
```

## Installation

```shell
npm install --save chdman
```

## Usage

```javascript
import chdman from 'chdman';

/**
 * Create and extract hard disks
 */
await chdman.createHd({
  inputFilename: 'original-image',
  outputFilename: 'image.chd',
});
console.log(await chdman.info({ inputFilename: 'image.chd' }));
// { inputFile: 'image.chd', fileVersion: 5, ... }
await chdman.extractHd({
  inputFilename: 'image.chd',
  outputFilename: 'extracted-image',
});


/**
 * Create and extract CD-ROMs
 */
await chdman.createCd({
  inputFilename: 'Original.cue',
  outputFilename: 'CD.chd',
});
console.log(await chdman.info({ inputFilename: 'CD.chd' }));
// { inputFile: 'CD.chd', fileVersion: 5, ... }
await chdman.extractCd({
  inputFilename: 'CD.chd',
  outputFilename: 'Extracted.cue',
  outputBinFilename: 'Extracted.bin',
});


/**
 * Create and extract DVD-ROMs
 */
await chdman.createDvd({
  inputFilename: 'Original.iso',
  outputFilename: 'DVD.chd',
});
console.log(await chdman.info({ inputFilename: 'DVD.chd' }));
// { inputFile: 'DVD.chd', fileVersion: 5, ... }
await chdman.extractDvd({
  inputFilename: 'DVD.chd',
  outputFilename: 'Extracted.iso',
});
```

## License

MAME and its tools are licensed under the GPLv2 license.
