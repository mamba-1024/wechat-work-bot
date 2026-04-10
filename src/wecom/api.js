const axios = require("axios");

const BASE_URL = "https://qyapi.weixin.qq.com";

let tokenCache = {
  token: "",
  expireAt: 0,
};

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expireAt) {
    return tokenCache.token;
  }

  const corpId = process.env.CORP_ID;
  const corpSecret = process.env.CORP_SECRET || process.env.SECRET;

  if (!corpId || !corpSecret) {
    throw new Error("缺少 CORP_ID 或 CORP_SECRET(SECRET) 环境变量");
  }

  const { data } = await axios.get(`${BASE_URL}/cgi-bin/gettoken`, {
    params: {
      corpid: corpId,
      corpsecret: corpSecret,
    },
    timeout: 5000,
  });

  if (data.errcode !== 0) {
    throw new Error(`获取 access_token 失败: ${data.errcode} ${data.errmsg}`);
  }

  tokenCache = {
    token: data.access_token,
    expireAt: now + (data.expires_in - 120) * 1000,
  };

  return tokenCache.token;
}

async function sendTextMessage({ toUser, content }) {
  const accessToken = await getAccessToken();
  const agentId = Number(process.env.AGENT_ID);

  if (!agentId) {
    throw new Error("缺少 AGENT_ID 环境变量");
  }

  const { data } = await axios.post(
    `${BASE_URL}/cgi-bin/message/send`,
    {
      touser: toUser,
      msgtype: "text",
      agentid: agentId,
      text: { content },
      safe: 0,
      enable_id_trans: 0,
      enable_duplicate_check: 0,
    },
    {
      params: { access_token: accessToken },
      timeout: 5000,
    }
  );

  if (data.errcode !== 0) {
    throw new Error(`发送消息失败: ${data.errcode} ${data.errmsg}`);
  }

  return data;
}

module.exports = {
  sendTextMessage,
};
