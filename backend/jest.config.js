/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@app-types/(.*)$': '<rootDir>/src/types/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
  },
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/**/*.d.ts'],
  coverageDirectory: '<rootDir>/coverage',
  testTimeout: 15000,
};
