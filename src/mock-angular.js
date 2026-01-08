// On crée une fausse classe qui ne fait rien
class AngularNodeAppEngine {
  handle(req) {
    // On renvoie "null" pour dire : "Je ne gère pas cette requête, passe à la suite"
    return Promise.resolve(null);
  }
}

// Des fausses fonctions vides
function createNodeRequestHandler(app) {
  return (req, res) => {};
}

function writeResponseToNodeResponse(response, res) {}

// On exporte tout ça pour que le serveur soit content
module.exports = {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse
};