const crypto = require("crypto");

const BLOCK_SIZE = 32;

function sha1Signature(token, timestamp, nonce, encrypted) {
  const raw = [token, timestamp, nonce, encrypted].sort().join("");
  return crypto.createHash("sha1").update(raw).digest("hex");
}

function pkcs7Decode(buffer) {
  const pad = buffer[buffer.length - 1];
  if (pad < 1 || pad > BLOCK_SIZE) {
    return buffer;
  }
  return buffer.slice(0, buffer.length - pad);
}

function decryptWecomMessage(encryptedBase64, encodingAesKey) {
  const aesKey = Buffer.from(`${encodingAesKey}=`, "base64");
  const iv = aesKey.subarray(0, 16);
  const encrypted = Buffer.from(encryptedBase64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const plain = pkcs7Decode(decrypted);

  const xmlLength = plain.readUInt32BE(16);
  const xmlContent = plain.subarray(20, 20 + xmlLength).toString("utf8");

  return xmlContent;
}

module.exports = {
  sha1Signature,
  decryptWecomMessage,
};
