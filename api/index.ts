import { app } from "./_app.js";

// Vercel entrypoint: keep one API function and let Express dispatch all /api routes.
// The matching rewrite is in the root vercel.json; splitting routes into separate
// functions can exceed the function limit on the Hobby plan.
export default app;
