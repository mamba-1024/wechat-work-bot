const dotenv = require("dotenv");
const { listGroupChats, getGroupChatDetail } = require("../wecom/groupchat");

dotenv.config();

async function main() {
  const listResult = await listGroupChats({ limit: 10 });
  const chats = listResult.group_chat_list || [];

  console.log(`客户群数量(本次返回): ${chats.length}`);
  if (chats.length === 0) {
    console.log("未查询到客户群，请检查权限、可见范围或是否存在客户群。");
    return;
  }

  const chatIds = chats.map((item) => item.chat_id);
  console.log("chat_id 列表:");
  chatIds.forEach((id, idx) => {
    console.log(`${idx + 1}. ${id}`);
  });

  const firstChatId = chatIds[0];
  const detailResult = await getGroupChatDetail(firstChatId);
  const groupChat = detailResult.group_chat || {};
  const members = groupChat.member_list || [];

  console.log("\n首个客户群详情:");
  console.log(`chat_id: ${groupChat.chat_id || firstChatId}`);
  console.log(`name: ${groupChat.name || "(无群名)"}`);
  console.log(`member_count: ${members.length}`);
}

main().catch((error) => {
  console.error("客户群校验失败:", error.message);
  process.exit(1);
});
