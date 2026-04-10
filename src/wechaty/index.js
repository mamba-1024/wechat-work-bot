const dotenv = require("dotenv");
const { createBot } = require("./bot");

dotenv.config();

async function main() {
  const bot = createBot();
  await bot.start();
  console.log("Wechaty bot started.");
}

main().catch((error) => {
  console.error("Wechaty bot start failed:", error);
  process.exit(1);
});

