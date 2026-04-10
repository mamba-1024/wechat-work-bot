// const qrcodeTerminal = require("qrcode-terminal");
const { EventLogger, QRCodeTerminal } = require('wechaty-plugin-contrib')
const { WechatyBuilder } = require('wechaty')

function getReply({ text, isRoom, mentioned }) {
  const t = (text || '').trim()
  if (!t) {
    return null
  }

  if (t.toLowerCase() === 'ping') {
    return 'pong'
  }

  if (t === '/help' || t === '帮助') {
    return '可用指令：ping、/help'
  }

  if (isRoom) {
    if (!mentioned) {
      return null
    }
    return `收到@消息：${t}`
  }

  return `已收到：${t}`
}

function createBot() {
  const bot = WechatyBuilder.build({
    name: process.env.WECHATY_NAME || 'wechaty-bot',
    // puppet: process.env.WECHATY_PUPPET || undefined,
    // puppetOptions: process.env.WECHATY_PUPPET_TOKEN
    //   ? { token: process.env.WECHATY_PUPPET_TOKEN }
    //   : undefined,
  })

  bot.use(EventLogger())
  bot.use(QRCodeTerminal())

  // bot.on("scan", (qrcode, status) => {
  //   console.log("scan status:", status);
  //   qrcodeTerminal.generate(qrcode, { small: true });
  //   console.log("如果你用的是网页扫码登录方案，请在终端扫码。");
  // });

  bot.on('login', (user) => {
    console.log('login:', user.name())
  })

  bot.on('logout', (user) => {
    console.log('logout:', user.name())
  })

  bot.on('error', (error) => {
    console.error('bot error:', error)
  })

  bot.on('message', onMessage)

  return bot
}

async function onMessage(message) {
  try {
    if (message.self()) {
      return
    }

    const text = (message.text() || '').trim()
    if (!text) {
      return
    }

    // room 存在表示群聊消息；群聊场景下仅在 @机器人 时回复，避免无差别刷屏。
    // mentionSelf() 只有在群聊才有意义；私聊时无需调用（也避免额外开销）。
    const room = message.room()
    const talker = message.talker()
    const isRoom = Boolean(room)
    const mentioned = isRoom ? await message.mentionSelf() : false

    const reply = getReply({ text, isRoom, mentioned })
    if (reply) {
      await message.say(reply)
    }

    if (!isRoom) {
      console.log('private msg from', talker.name(), ':', text)
    }
  } catch (error) {
    console.error('handle message error:', error.message)
  }
}

module.exports = { createBot, getReply }
