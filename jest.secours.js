/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    // Indique à Jest d'utiliser ts-jest pour tous les fichiers .ts
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true, // Accélère la compilation pour les tests
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Ignore le dossier de build angular pour éviter les conflits
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/browser/'],
};