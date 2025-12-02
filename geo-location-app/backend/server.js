require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Defect = require('./models/Place');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = 'mongodb+srv://vickgzambom_db_user:mcYHNCBUhToXKG9W@geo-app.pxllqrd.mongodb.net/geoapp?retryWrites=true&w=majority&appName=geo-app';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API de Registro de Defeitos' });
});

app.get('/api/places', async (req, res) => {
  try {
    const defects = await Defect.find().sort({ createdAt: -1 });
    res.json(defects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar registros' });
  }
});

app.post('/api/places', async (req, res) => {
  try {
    const { title, description, laboratory, latitude, longitude, photo } = req.body;

    if (!title || !description || !laboratory || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: title, description, laboratory, latitude, longitude' });
    }

    const defect = new Defect({
      title,
      description,
      laboratory,
      latitude,
      longitude,
      photo: photo || null,
    });

    await defect.save();
    res.status(201).json(defect);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar registro' });
  }
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas conectado');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar no MongoDB', err);
    process.exit(1);
  });