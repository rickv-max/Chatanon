const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys")
const { Boom } = require("@hapi/boom")
const fs = require("fs")

// Gunakan single file session
const { state, saveState } = useSingleFileAuthState("./session/creds.json")

async function connect() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on("creds.update", saveState)

    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log("Connection closed. Reconnecting:", shouldReconnect)
            if (shouldReconnect) {
                connect()
            }
        } else if (connection === "open") {
            console.log("✅ BOT TERHUBUNG KE WHATSAPP!")
        }
    })

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return
        const msg = messages[0]
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text

        if (text === "!ping") {
            await sock.sendMessage(msg.key.remoteJid, { text: "Pong!" })
        }
    })
}

connect()
