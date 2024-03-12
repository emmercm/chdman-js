<h1 align="center">💿️ chdman</h1>

<p align="center"><b>Pre-compiled binaries and Node.js wrapper for MAME's <a href="https://docs.mamedev.org/tools/chdman.html">chdman</a> tool.</b></p>

<p align="center">
  <a href="https://www.npmjs.com/package/chdman"><img alt="npm: version" src="https://img.shields.io/npm/v/chdman?color=%23cc3534&label=version&logo=npm&logoColor=white"></a>
  <a href="https://www.npmjs.com/package/chdman"><img alt="npm: downloads" src="https://img.shields.io/npm/dt/chdman?color=%23cc3534&logo=npm&logoColor=white"></a>
  <a href="https://github.com/emmercm/chdman-js"><img alt="GitHub: stars" src="https://img.shields.io/github/stars/emmercm/chdman-js?style=flat&logo=github&logoColor=white&color=%236e5494"></a>
  <a href="https://github.com/emmercm/chdman-js/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/github/license/emmercm/chdman-js?color=blue"></a>
</p>

## Supported platforms

| OS                     | Architectures                                        | Additional Instructions                                                                                 |
|------------------------|------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| [Windows](./bin/win32) | • x64<br>• x86                                       |                                                                                                         |
| [macOS](./bin/darwin)  | • arm64 (Apple Silicon)<br>• x64 (Intel)             | [SDL2](https://www.libsdl.org/) is required to be installed separately:<br><pre>brew install sdl2</pre> |
| [Linux](./bin/linux)   | • x64<br>• x86<br>• arm (armhf)<br>• arm64 (aarch64) |                                                                                                         |

Any `chdman` that exists on your `$PATH` will be preferred over the bundled binaries. This lets you control the build that is right for your machine.

## Installation

```shell
npm install --save chdman
```

## Usage

```javascript
import chdman from 'chdman';

/**
 * Create and extract CD-ROMs
 */
await chdman.createCd({
  inputFilename: 'Original.cue',
  outputFilename: 'Disc.chd',
});
console.log(await chdman.info('Disc.chd'));
// { inputFile: 'Disc.chd', fileVersion: 5, ... }
await chdman.extractCd({
  inputFilename: 'Disc.chd',
  outputFilename: 'Extracted.cue',
  outputBinFilename: 'Extracted.bin',
});

/**
 * Create and extract hard disks
 */
await chdman.createHd({
  inputFilename: 'original-image',
  outputFilename: 'image.chd',
});
console.log(await chdman.info('image.chd'));
// { inputFile: 'image.chd', fileVersion: 5, ... }
await chdman.extractHd({
  inputFilename: 'image.chd',
  outputFilename: 'extracted-image',
});
```
