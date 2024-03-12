// https://docs.mamedev.org/tools/chdman.html#compression-algorithms
enum CompressionAlgorithm {
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

export default CompressionAlgorithm;
