import { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  testTimeout: 10_000,

  // BEGIN https://kulshekhar.github.io/ts-jest/docs/guides/esm-support
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // END https://kulshekhar.github.io/ts-jest/docs/guides/esm-support
  },

  // Don't run any compiled versions of the tests, if they exist
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  // Don't report coverage on the test directory
  coveragePathIgnorePatterns: ['<rootDir>/test/'],

  // Report coverage on all source files, because it won't by default...
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,cjs,mjs,ts}'],
};

export default jestConfig;
