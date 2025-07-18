const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client();

client.on('qr', qr => {
    console.log('Scan QR ini untuk login WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot siap digunakan (ONLINE).');
});

// Contoh fungsi kirim pesan via URL
app.get('/send', async (req, res) => {
    const { to, msg } = req.query;

    if (!to || !msg) {
        return res.send('Gunakan ?to=nomor&msg=pesan');
    }

    try {
        const chatId = to + '@c.us';
        await client.sendMessage(chatId, msg);
        res.send('Pesan dikirim ke ' + to);
    } catch (e) {
        res.send('Gagal kirim: ' + e.message);
    }
});

client.initialize();
app.listen(PORT, () => {
    console.log('Server berjalan di port ' + PORT);
});
