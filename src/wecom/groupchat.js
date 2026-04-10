const axios = require("axios");

const BASE_URL = "https://qyapi.weixin.qq.com";

let contactTokenCache = {
  token: "",
  expireAt: 0,
};

async function getContactAccessToken() {
  const now = Date.now();
  if (contactTokenCache.token && now < contactTokenCache.expireAt) {
    return contactTokenCache.token;
  }

  const corpId = process.env.CORP_ID;
  const contactSecret =
    process.env.CONTACT_SECRET || process.env.CORP_SECRET || process.env.SECRET;

  if (!corpId || !contactSecret) {
    throw new Error("缺少 CORP_ID 或 CONTACT_SECRET(CORP_SECRET/SECRET) 环境变量");
  }

  const { data } = await axios.get(`${BASE_URL}/cgi-bin/gettoken`, {
    params: {
      corpid: corpId,
      corpsecret: contactSecret,
    },
    timeout: 5000,
  });

  if (data.errcode !== 0) {
    throw new Error(`获取客户联系 access_token 失败: ${data.errcode} ${data.errmsg}`);
  }

  contactTokenCache = {
    token: data.access_token,
    expireAt: now + (data.expires_in - 120) * 1000,
  };

  return contactTokenCache.token;
}

async function listGroupChats({ limit = 1000, cursor = undefined } = {}) {
  const accessToken = await getContactAccessToken();
  const { data } = await axios.post(
    `${BASE_URL}/cgi-bin/externalcontact/groupchat/list`,
    {
      status_filter: 0,
      limit,
      cursor,
    },
    {
      params: { access_token: accessToken },
      timeout: 8000,
    }
  );

  if (data.errcode !== 0) {
    throw new Error(`获取客户群列表失败: ${data.errcode} ${data.errmsg}`);
  }

  return data;
}

async function getGroupChatDetail(chatId) {
  if (!chatId) {
    throw new Error("chatId 不能为空");
  }

  const accessToken = await getContactAccessToken();
  const { data } = await axios.post(
    `${BASE_URL}/cgi-bin/externalcontact/groupchat/get`,
    { chat_id: chatId },
    {
      params: { access_token: accessToken },
      timeout: 8000,
    }
  );

  if (data.errcode !== 0) {
    throw new Error(`获取客户群详情失败: ${data.errcode} ${data.errmsg}`);
  }

  return data;
}

/**
 * 创建「客户群」企业群发任务（官方：创建企业群发）。
 * 注意：调用后不会立刻出现在群里，需指定 sender 成员在企业微信「群发助手」里确认后才会发出。
 * @param {{ chatIdList: string[], sender: string, content: string }} params
 */
async function addGroupMsgTemplate({ chatIdList, sender, content }) {
  if (!Array.isArray(chatIdList) || chatIdList.length === 0) {
    throw new Error("chatIdList 必须为非空数组");
  }
  if (!sender) {
    throw new Error("sender 必填：发送成员的企业微信 userid（客户群场景必填）");
  }
  const text = (content || "").trim();
  if (!text) {
    throw new Error("content 不能为空");
  }

  const accessToken = await getContactAccessToken();
  const { data } = await axios.post(
    `${BASE_URL}/cgi-bin/externalcontact/add_msg_template`,
    {
      chat_type: "group",
      chat_id_list: chatIdList,
      sender,
      text: { content: text },
    },
    {
      params: { access_token: accessToken },
      timeout: 15000,
    }
  );

  if (data.errcode !== 0) {
    throw new Error(`创建客户群群发失败: ${data.errcode} ${data.errmsg}`);
  }

  return data;
}

module.exports = {
  listGroupChats,
  getGroupChatDetail,
  addGroupMsgTemplate,
};
