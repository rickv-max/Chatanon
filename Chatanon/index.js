const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const P = require('pino')
const fs = require('fs')

const { state, saveState } = useSingleFileAuthState('./session/creds.json')

async function startSock() {
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Koneksi terputus. Reconnect:', shouldReconnect)
            if (shouldReconnect) {
                startSock()
            }
        } else if (connection === 'open') {
            console.log('Bot siap digunakan!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
        console.log('Pesan masuk:', text)

        if (text?.toLowerCase() === 'halo') {
            await sock.sendMessage(from, { text: 'Hai! Ini ChatAnon Bot 👋' })
        }
    })
}

startSock()
