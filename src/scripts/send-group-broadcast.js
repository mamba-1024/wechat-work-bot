const dotenv = require("dotenv");
const { addGroupMsgTemplate } = require("../wecom/groupchat");

dotenv.config();

function parseChatIds(raw) {
  if (!raw || typeof raw !== "string") {
    return [];
  }
  return raw
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const sender = process.env.BROADCAST_SENDER;
  let chatIds = parseChatIds(process.env.BROADCAST_CHAT_IDS);
  let text = (process.env.BROADCAST_TEXT || "").trim();

  const argChat = process.argv[2];
  const argText = process.argv[3];
  if (argChat) {
    chatIds = parseChatIds(argChat);
  }
  if (argText) {
    text = argText.trim();
  }

  if (!sender) {
    console.error("请设置 BROADCAST_SENDER（发送成员的企业微信 userid）");
    process.exit(1);
  }
  if (chatIds.length === 0) {
    console.error("请设置 BROADCAST_CHAT_IDS 或在命令行传入 chat_id（多个用逗号分隔）");
    process.exit(1);
  }
  if (!text) {
    console.error("请设置 BROADCAST_TEXT 或在命令行第二个参数传入正文");
    process.exit(1);
  }

  const result = await addGroupMsgTemplate({
    chatIdList: chatIds,
    sender,
    content: text,
  });

  console.log("创建群发任务成功（成员需在群发助手中确认后才会发出）：");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("群发失败:", error.message);
  process.exit(1);
});
