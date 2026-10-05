module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: [
    'ios.ts',
    'android.ts',
    'native.ts',
    'ts',
    'ios.tsx',
    'android.tsx',
    'native.tsx',
    'tsx',
    'ios.js',
    'android.js',
    'native.js',
    'js',
    'jsx',
    'json',
    'node',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/([^/]+)/node_modules/(react-native|@react-native|expo|@expo|@react-native-async-storage)|react-native|@react-native|expo|@expo|@react-native-async-storage))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
