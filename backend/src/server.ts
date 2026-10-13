import { app } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

const start = async () => {
  await connectDatabase();
  app.listen(env.PORT, () => console.log(`API listening on port ${env.PORT}`));
};

void start();
