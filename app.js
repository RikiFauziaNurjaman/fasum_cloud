require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Support both local file and Vercel environment variable
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
  // On Vercel, load from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hai, ini adalah REST API untuk aplikasi Fasum!',
    endpoints: {
      '/send-to-device': 'POST - Kirim notifikasi ke satu perangkat',
      '/send-to-multiple': 'POST - Kirim notifikasi ke banyak perangkat (multicast)',
      '/send-to-topic': 'POST - Kirim notifikasi ke topik',
    },
  });
});


app.post('/send-to-device', async (req, res) => {
  const { token, title, body, senderName, senderPhotoUrl } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'token, title, dan body wajib diisi' });
  }

  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: {
      title: title || 'Notifikasi Baru',
      body: body || 'Anda memiliki notifikasi baru',
      senderName: senderName || 'Admin',
      senderPhotoUrl: senderPhotoUrl || '',
      sentAt: new Date().toISOString(),
      messageType: 'direct-notification',
    },
    android: {
      priority: 'high',
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.post('/send-to-multiple', async (req, res) => {
  const { tokens, title, body, senderName, senderPhotoUrl } = req.body;

  if (!Array.isArray(tokens) || tokens.length === 0 || !title || !body) {
    return res.status(400).json({ error: 'tokens (array), title, dan body wajib diisi' });
  }

  const message = {
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      title: title || 'Notifikasi Baru',
      body: body || 'Anda memiliki notifikasi baru',
      senderName: senderName || 'Admin',
      senderPhotoUrl: senderPhotoUrl || '',
      sentAt: new Date().toISOString(),
      messageType: 'multicast-notification',
    },
    android: {
      priority: 'high',
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
    },
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    res.status(200).json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/send-to-topic', async (req, res) => {
  const { topic, title, body, senderName, senderPhotoUrl } = req.body;

  if (!topic || !title || !body) {
    return res.status(400).json({ error: 'topic, title, dan body wajib diisi' });
  }

  const message = {
    topic,
    notification: {
      title,
      body,
    },
    data: {
      title: title || 'Notifikasi Baru',
      body: body || 'Anda memiliki notifikasi baru',
      senderName: senderName || 'Admin',
      senderPhotoUrl: senderPhotoUrl || '',
      sentAt: new Date().toISOString(),
      messageType: 'topic-notification',
    },
    android: {
      priority: 'high',
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({
      success: true,
      message: `Notifikasi berhasil dikirim ke topic '${topic}'`,
      response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Only listen when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


module.exports = app;
