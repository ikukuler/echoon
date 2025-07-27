/** @type {import('jest').Config} */
module.exports = {
  // TypeScript preset
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test files patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test-*',
    '!coverage/**'
  ],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Test timeout
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Transform settings for TypeScript
  transform: {
    '^.+\.ts$': 'ts-jest'
  },

  // File extensions to process
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Global setup/teardown (временно отключено для упрощения)
  // globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',
  // globalTeardown: '<rootDir>/src/__tests__/globalTeardown.ts',

  // Environment variables for tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  // Extensions to transform
  extensionsToTreatAsEsm: [],

  // Globals for ts-jest
  globals: {}
}; 