const readline = require("readline");
const dotenv = require("dotenv");
const { getReply } = require("./bot");

dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { room: false, mentioned: false };
  for (const a of args) {
    if (a === "--room") opts.room = true;
    if (a === "--mentioned") opts.mentioned = true;
  }
  return opts;
}

async function main() {
  const opts = parseArgs();

  console.log("本地模拟器已启动：每行输入一条消息，回车后输出机器人回复。");
  console.log("参数：--room 表示群聊；--mentioned 表示在群里@了机器人。");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.on("line", (line) => {
    const reply = getReply({
      text: line,
      isRoom: opts.room,
      mentioned: opts.room ? opts.mentioned : false,
    });

    console.log(reply ? `BOT> ${reply}` : "BOT> (no reply)");
  });
}

main().catch((error) => {
  console.error("simulate error:", error);
  process.exit(1);
});

