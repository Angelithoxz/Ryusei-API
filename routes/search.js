const express = require('express');
const router = express.Router();
const { checkKey, resDefault } = require('../database/db');
const yts = require('yt-search');
let creator = "i'm Fz ~"

router.get('/search/youtube', async (req, res) => {
  const query = req.query.q;  
  if (!query) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q' });
  const user = checkKey(req, res);
  if (!user) return;
  try {
    const results = await yts(query);
    const videos = results.videos.slice(0, 10).map(video => ({
      title: video.title,
      url: video.url,
      duration: video.timestamp,
      views: video.views,
      published: video.ago,
      author: video.author.name,
      channelID: video.author.url,
      thumbnail: video.thumbnail
    }));
    
    return res.json({
      status: true,
      creator,
      res: videos
    });
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/search/spotify', async (req, res) => {
  const q = req.query.q;  
  if (!q) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { search } = require("../scrapers/spotify.js")
    const ress = await search(q);
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
})

router.get('/search/pinterest', async (req, res) => {
  const q = req.query.q;  
  if (!q) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { pins } = require("../scrapers/pinterest.js")
    const ress = await pins(q);
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

router.get('/search/tiktoks', async (req, res) => {
  const q = req.query.q;  
  if (!q) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { tts } = require("../scrapers/tiktoks.js")
    const ress = await tts(q);
    return res.json(ress);
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/search/xvideos', async (req, res) => {
  const q = req.query.q;  
  if (!q) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { Xvideos } = require("../scrapers/xdl.js")
    let x = new Xvideos()
    const ress = await x.search(q);
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
})

router.get('/search/xnxx', async (req, res) => {
  const q = req.query.q;  
  if (!q) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { Xnxx } = require("../scrapers/xdl.js")
    let x = new Xnxx()
    const ress = await x.search(q);
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
})

module.exports = router;