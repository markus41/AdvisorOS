const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/**', // Exclude Next.js app directory
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@cpa-platform/database$': '<rootDir>/../packages/database/src',
  },
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$|@tremor/react|@azure|stripe))',
  ],
  projects: [
    // Unit tests
    {
      displayName: 'unit',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    // Integration tests
    {
      displayName: 'integration',
      testEnvironment: 'jest-environment-node',
      testMatch: ['<rootDir>/tests/integration/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
    },
    // Performance tests
    {
      displayName: 'performance',
      testEnvironment: 'jest-environment-node',
      testMatch: ['<rootDir>/tests/performance/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/performance/setup.js'],
    },
    // Security tests
    {
      displayName: 'security',
      testEnvironment: 'jest-environment-node',
      testMatch: ['<rootDir>/tests/security/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/security/setup.js'],
    },
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)