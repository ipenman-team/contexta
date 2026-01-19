module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@contexta/slate-converters$': '<rootDir>/../../packages/slate-converters/src/index.ts',
  },
  roots: ['<rootDir>/src', '<rootDir>/../../packages/slate-converters/src'],
  testMatch: [
    '<rootDir>/src/**/test/unit/**/*.spec.ts',
    '<rootDir>/../../packages/slate-converters/src/**/test/unit/**/*.spec.ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.(t|j)s'],
  coverageDirectory: '<rootDir>/coverage/unit',
};
