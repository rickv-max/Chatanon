import makeWASocket, { DisconnectReason, useSingleFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'

// Load atau buat session file
const { state, saveState } = useSingleFileAuthState('./session/creds.json')

// Buat koneksi ke WhatsApp
const startSock = () => {
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    })

    // Simpan session saat berubah
    sock.ev.on('creds.update', saveState)

    // Respon pesan masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            const msg = messages[0]
            const from = msg.key.remoteJid
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text

            if (!msg.key.fromMe && text) {
                console.log(`📩 Pesan dari ${from}: ${text}`)
                await sock.sendMessage(from, { text: 'Pesan kamu sudah terkirim secara anonim. ✉️' })
            }
        }
    })

    // Handle disconnect
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('⚠️ Koneksi terputus. Reconnect:', shouldReconnect)
            if (shouldReconnect) {
                startSock()
            }
        } else if (connection === 'open') {
            console.log('✅ Bot terhubung ke WhatsApp!')
        }
    })
}

// Mulai bot
startSock()
