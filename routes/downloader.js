const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const axios = require("axios");
const { checkKey, getUser, resDefault } = require('../database/db');
let creator = "i'm Fz ~"

router.get('/download/ytmp4', async (req, res) => {
  const url = req.query.url; 
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { ytmp4 } = require("../scrapers/youtube.js")
    const result = await ytmp4(url);
    return res.json({
      status: true,
      creator,
      res: result
    });
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/ytmp3', async (req, res) => {
  const url = req.query.url; 
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;

  try {
    const { MP3 } = require("../scrapers/ytmp3x.js")
    const result = await MP3(url);
    return res.json({
      status: true,
      creator,
      res: result
    });
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/v2/ytmp3', async (req, res) => {
  const url = req.query.url; 
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;

  try {
    const { mp3 } = require("../scrapers/ymp3.js")
    const result = await mp3(url);
    return res.json({
      status: true,
      creator,
      res: result
    });
  } catch (e) {
    console.error(e);
    return res.json(e);
  }
});

router.get('/download/spotify', async (req, res) => {
  const url = req.query.url;  
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;

  try {
    const { dl } = require("../scrapers/spoti.js")
    const result = await dl(url);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/pinterest', async (req, res) => {
  const url = req.query.url;  
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro URL' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { pindl } = require("../scrapers/pinterest.js")
    const ress = await pindl(url);
let result = {
      status: true,
      creator,
      data: ress
    }
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/mediafire', async (req, res) => {
  const url = req.query.url;  
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro URL' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { mediafire } = require("../scrapers/mediafire.js")
    const ress = await mediafire(url);
let result = {
      status: true,
      creator,
      data: ress
    }
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/instagram', async (req, res) => {
  const url = req.query.url; 
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro URL' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { Instagram } = require("../scrapers/instagram.js")
    const ress = await Instagram(url);
let result = {
      status: true,
      creator,
      result: ress
    }
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/facebook', async (req, res) => {
  const url = req.query.url; 
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro URL' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { fbdl } = require("../scrapers/facebook.js")
    const ress = await fbdl(url);
let result = {
      status: true,
      data: ress.data
    }
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/tiktok', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro URL' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { tiktok } = require("../scrapers/tiktok.js")
    const ress = await tiktok(url);
    return res.json(ress);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/npm', async (req, res) => {
  const pkg = req.query.pkg;
  const version = req.query.version || "latest"
  if (!pkg) return res.json({ status: false, creator, mensaje: 'Falta el parámetro pkg' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { npmdl } = require("../scrapers/npmdl.js")
    const ress = await npmdl(pkg, version);
let result = {
      status: true,
      creator,
      data: ress
    }
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/terabox', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { Terabox } = require("../scrapers/terabox.js")
    const result = await Terabox(url);
    return res.json({
      status: true,
      creator,
      res: result
    });
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/ytmp4v2', async (req, res) => {
  const url = req.query.url;
  const q = req.query.q
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { ytdl } = require("../scrapers/ytdl.js")
    const result = await ytdl.d(url, q || "360");
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/ytmp3v2', async (req, res) => {
  const url = req.query.url
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { ytmp3 } = require("../scrapers/sylphy.js")
    const result = await ytmp3(url);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/ytplay', async (req, res) => {
  const { q, format } = req.query; 
  if (!q || !format) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q o format' });
  const user = checkKey(req, res);
if (!user) return;

  try {
    const { ytplay } = require("../scrapers/ytplay.js")
    const result = await ytplay(q, format);
    return res.json({
      status: true,
      creator,
      res: result
    });
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/xvideos', async (req, res) => {
  const url = req.query.url; 
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { Xvideos } = require("../scrapers/xdl.js")
    let x = new Xvideos()
    const result = await x.dl(url);
    return res.json({
      status: true,
      creator,
      res: result
    });
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/download/xnxx', async (req, res) => {
  const url = req.query.url; 
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { Xnxx } = require("../scrapers/xdl.js")
    let x = new Xnxx()
    const result = await x.dl(url);
    return res.json({
      status: true,
      creator,
      res: result
    });
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

module.exports = router;