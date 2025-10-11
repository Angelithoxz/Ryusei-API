const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const axios = require("axios");
const { checkKey, getUser, resDefault } = require('../database/db');
let creator = "i'm Fz ~"

router.get('/tools/lyrics', async (req, res) => {
  const q = req.query.q; 
  if (!q) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { Lyric } = require("../scrapers/lyrics.js")
    const ress = await Lyric(q);
    return res.json(ress);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/tools/hostinfo', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.json({ status: false, creator, mensaje: 'Falta el parámetro domain' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { hostInfo } = require("../scrapers/domainip.js")
    const ress = await hostInfo(domain);
    return res.json(ress);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get("/tools/upscale", async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const url = req.query.url; 
 const user = checkKey(req, res);
if (!user) return;
  if (!url) return res.status(400).json({ status: false, message: "Falta el parámetro 'url'." });
  const { upscale } = require("../scrapers/upscale");
  try {
    const json = await upscale(url);
    const filePath = path.resolve(__dirname, json);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: false, message: "Archivo no encontrado." });
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mime = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error al procesar la solicitud.",
      error: err.message,
    });
  }
});

module.exports = router;