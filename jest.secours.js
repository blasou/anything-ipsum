/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    // On capture tous les fichiers .ts
    '^.+\\.ts$': ['ts-jest', {
      // On force la compilation en CommonJS (le format que Jest préfère)
      // Cela écrase la configuration par défaut d'Angular qui est en ESM
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
      },
      isolatedModules: true,
    }],
  },
  // On ignore le build Angular pour ne pas tester deux fois
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/browser/'],
};