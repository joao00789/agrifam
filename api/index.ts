import { app } from "./_app.js";

// Eu explico: Ponto de entrada da Vercel: mantenha uma função de API e deixe o Express
// Eu explico: encaminhar todas as rotas /api. A reescrita correspondente fica em vercel.json;
// Eu explico: dividir as rotas pode ultrapassar o limite de funções do plano Hobby.
export default app;
