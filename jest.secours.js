/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    // On dit à ts-jest de gérer les fichiers .ts, .js ET .mjs (le format d'Angular)
    '^.+\\.(ts|js|mjs)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        allowJs: true,
        module: 'commonjs',
        esModuleInterop: true,
      },
      isolatedModules: true,
    }],
  },
  // C'EST LA LIGNE MAGIQUE :
  // On dit "Ignore node_modules SAUF le dossier @angular"
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular)'
  ],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/browser/'],
};