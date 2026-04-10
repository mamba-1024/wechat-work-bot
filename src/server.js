const express = require("express");
const dotenv = require("dotenv");
const { parseStringPromise } = require("xml2js");
const { sha1Signature, decryptWecomMessage } = require("./wecom/crypto");
const { sendTextMessage } = require("./wecom/api");

dotenv.config();

const app = express();

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "wechat-work-bot" });
});

app.get("/wecom/callback", (req, res) => {
  try {
    const { msg_signature: msgSignature, timestamp, nonce, echostr } = req.query;
    const token = process.env.WECOM_TOKEN || process.env.TOKEN;
    const encodingAesKey = process.env.ENCODING_AES_KEY;

    if (!token || !encodingAesKey) {
      return res.status(500).send("缺少 WECOM_TOKEN(TOKEN) 或 ENCODING_AES_KEY");
    }

    const localSign = sha1Signature(token, timestamp, nonce, echostr);
    if (localSign !== msgSignature) {
      return res.status(401).send("invalid signature");
    }

    const plainText = decryptWecomMessage(echostr, encodingAesKey);
    return res.send(plainText);
  } catch (error) {
    console.error("GET callback error:", error.message);
    return res.status(500).send("error");
  }
});

app.post("/wecom/callback", express.text({ type: "*/*" }), async (req, res) => {
  try {
    const { msg_signature: msgSignature, timestamp, nonce } = req.query;
    const token = process.env.WECOM_TOKEN || process.env.TOKEN;
    const encodingAesKey = process.env.ENCODING_AES_KEY;

    if (!token || !encodingAesKey) {
      return res.status(500).send("缺少 WECOM_TOKEN(TOKEN) 或 ENCODING_AES_KEY");
    }

    const bodyJson = await parseStringPromise(req.body, { explicitArray: false });
    const encrypted = bodyJson?.xml?.Encrypt;

    if (!encrypted) {
      return res.status(400).send("missing Encrypt field");
    }

    const localSign = sha1Signature(token, timestamp, nonce, encrypted);
    if (localSign !== msgSignature) {
      return res.status(401).send("invalid signature");
    }

    const plainXml = decryptWecomMessage(encrypted, encodingAesKey);
    const msg = await parseStringPromise(plainXml, { explicitArray: false });
    const payload = msg?.xml || {};

    if (payload.MsgType === "text" && payload.FromUserName) {
      const text = (payload.Content || "").trim();
      const reply = text.toLowerCase() === "ping" ? "pong" : `已收到: ${text || "(空消息)"}`;
      await sendTextMessage({
        toUser: payload.FromUserName,
        content: reply,
      });
    }

    return res.send("success");
  } catch (error) {
    console.error("POST callback error:", error.message);
    return res.status(500).send("error");
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`wechat-work-bot listening on port ${port}`);
});
