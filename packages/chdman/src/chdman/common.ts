// https://docs.mamedev.org/tools/chdman.html#compression-algorithms
export enum CHDCompressionAlgorithm {
  ZLIB = 'zlib',
  ZSTANDARD = 'zstd',
  LZMA = 'lzma',
  HUFFMAN = 'huff',
  FLAC = 'flac',
  ZLIB_CDROM = 'cdzl',
  ZSTANDARD_CDROM = 'cdzs',
  LZMA_CDROM = 'cdlz',
  FLAC_CDROM = 'cdfl',
  HUFFMAN_AV = 'avhu',
}

export enum CHDType {
  RAW = 'RAW',
  HARD_DISK = 'HARD_DISK',
  CD_ROM = 'CD_ROM',
  GD_ROM = 'GD_ROM',
  DVD_ROM = 'DVD_ROM',
  // LASER_DISC,
}
