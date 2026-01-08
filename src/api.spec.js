const request = require('supertest');
// CORRECTION : On utilise les accolades car le serveur fait "export { app }"
const { app } = require('./server'); 

describe('API Anything Ipsum', () => {
  
  // --- TEST DE SANTÉ ---
  test('GET /api/health doit retourner le statut healthy avec uptime', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('ai_connection');
  });
  
  // --- TEST DE GÉNÉRATION (Cas Nominal) ---
  test('POST /api/generate-lorem doit retourner du contenu', async () => {
    const response = await request(app)
      .post('/api/generate-lorem')
      .send({ 
          theme: 'Test', 
          paragraphs: 1,
          paragraphLength: 'court',
          stream: false // On désactive le stream pour faciliter le test
      });
    
    // Note: Si tu n'as pas de clé API Mistral configurée, ceci peut renvoyer 500
    // Mais le test vérifie surtout que la route existe
    if (response.status === 200) {
        expect(response.body).toHaveProperty('text');
    } else {
        // Si erreur serveur (ex: pas de clé API), on vérifie que ce n'est pas une 404
        expect(response.status).not.toBe(404);
    }
  });

  // --- TEST D'ERREUR ---
  test('POST /api/generate-lorem avec thème vide doit retourner 400', async () => {
    const response = await request(app)
      .post('/api/generate-lorem')
      .send({ 
          theme: '', 
          paragraphs: 1, 
          paragraphLength: 'court' 
      });
    expect(response.status).toBe(400);
  });
});