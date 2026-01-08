// CORRECTION 1 : Indispensable pour éviter l'erreur "JIT compilation failed" avec tsx
import '@angular/compiler';

import {config} from 'dotenv';
config();

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const browserDistFolder = join(__dirname, '../browser');

const app = express();

// CORRECTION 2 : Initialisation sécurisée d'Angular
// Si le manifest est absent (cas sur la VM), on ne fait pas planter le serveur
let angularApp: any;
try {
  angularApp = new AngularNodeAppEngine();
} catch (error) {
  console.warn("⚠️ AVERTISSEMENT: Moteur Angular non chargé (Manifest manquant).");
  console.warn("   Le serveur démarre en mode API uniquement.");
  // On crée un faux moteur pour que le code plus bas ne plante pas
  angularApp = {
    handle: () => Promise.resolve(null)
  };
}

// Middleware pour parser le JSON
app.use(express.json());

// Configuration CORS
app.use(cors({
  origin: process.env['APP_URL'] || '*', // Accepte tout par défaut si pas de variable
  credentials: true
}));

// Rate limiting pour l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Endpoint de santé (Requis pour les tests CI)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ai_connection: !!process.env['MISTRAL_API_KEY']
  });
});

// API endpoint pour générer le lorem ipsum
app.post('/api/generate-lorem', apiLimiter, async (req, res): Promise<void> => {
  try {
    const {theme, paragraphs, paragraphLength, stream = true} = req.body;

    // Validation des paramètres
    if (!theme || !theme.trim()) {
      res.status(400).json({
        success: false,
        error: 'Le thème est requis'
      });
      return;
    }

    if (!paragraphs || paragraphs < 1) {
      res.status(400).json({
        success: false,
        error: 'Le nombre de paragraphes doit être supérieur à 0'
      });
      return;
    }

    type ParagraphLength = 'court' | 'moyen' | 'long' | 'variable';
    const validLengths: ParagraphLength[] = ['court', 'moyen', 'long', 'variable'];

    if (!paragraphLength || !validLengths.includes(paragraphLength)) {
      res.status(400).json({
        success: false,
        error: 'La taille de paragraphe doit être : court, moyen, long ou variable'
      });
      return;
    }

    const apiKey = process.env['MISTRAL_API_KEY'];
    if (!apiKey || apiKey === 'your_mistral_api_key_here') {
      res.status(500).json({
        success: false,
        error: 'Clé API Mistral non configurée'
      });
      return;
    }

    const lengthInstructions: Record<ParagraphLength, string> = {
      'court': 'environ 1-10 phrases par paragraphe',
      'moyen': 'environ 10-20 phrases par paragraphe',
      'long': 'environ 20-30 phrases par paragraphe',
      'variable': 'longueur variable par paragraphe allant de 1 à 30 phrases',
    };

    const prompt = `Génère un faux texte de type "lorem ipsum" sur le thème "${theme}".
Le texte doit contenir ${paragraphs} paragraphe(s), avec ${lengthInstructions[paragraphLength as ParagraphLength]}.

Règles importantes :
- Utilise un vocabulaire et des références liés au thème "${theme}"
- Les phrases doivent avoir une structure similaire au lorem ipsum (un peu artificielle mais lisible)
- Mélange des mots du thème avec des mots de liaison classiques
- Commence chaque paragraphe par une majuscule
- Assure-toi que le texte soit cohérent avec le thème choisi
- Le résultat doit être du texte de remplissage, pas du contenu informatif réel
- Respecte bien la consigne de longueur : ${lengthInstructions[paragraphLength as ParagraphLength]}

Réponds uniquement avec le texte généré, sans commentaires ni explications.`;

    const mistralConfig = {
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
      stream: stream
    };

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(mistralConfig)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur API Mistral:', response.status, errorData);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération du texte'
      });
      return;
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (!response.body) {
        res.status(500).end('Erreur: pas de corps de réponse');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                res.end();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  const cleanedContent = content.replace(/\*/g, '');
                  res.write(cleanedContent);
                }
              } catch {}
            }
          }
        }
      } finally {
        reader.releaseLock();
        res.end();
      }
    } else {
      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        res.status(500).json({ success: false, error: 'Aucun texte généré' });
        return;
      }

      const cleanedText = generatedText.trim().replace(/\*/g, '');
      res.json({ success: true, text: cleanedText });
    }

  } catch (error) {
    console.error('Erreur lors de la génération:', error);
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  // On utilise notre variable sécurisée ici
  angularApp
    .handle(req)
    .then((response: any) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (require.main === module) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
export { app };