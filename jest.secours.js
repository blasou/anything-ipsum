module.exports = {
  testEnvironment: 'node',
  
  // Configuration pour lire le TypeScript
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      tsconfig: {
        // Ces deux options sont vitales pour éviter l'erreur "express is not a function"
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }],
  },

  // Redirection magique : quand le serveur demande Angular, on lui donne notre fichier vide
  moduleNameMapper: {
    '^@angular/ssr/node$': '<rootDir>/src/mock-angular.js'
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
};