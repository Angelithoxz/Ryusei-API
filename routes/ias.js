const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const axios = require("axios");
const { checkKey, getUser, resDefault } = require('../database/db');
let creator = "i'm Fz ~"

router.get('/ai/chatgpt', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.json({ status: false, creator, mensaje: 'Falta el parámetro text' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { gemini } = require("../scrapers/openai.js")
    const ress = await gemini.ask(text);
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

router.get('/ai/ghibli', async (req, res) => {
  const url = req.query.url; 
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { ghibli } = require("../scrapers/ghibli.js")
    const result = await ghibli(url);
    return res.json(result)
  } catch (e) {
    console.error(e);
    return res.json(resDefault.error);
  }
});

router.get('/ai/blackbox', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.json({ status: false, creator, mensaje: 'Falta el parámetro text' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { blackbox } = require("../scrapers/openai.js")
    const ress = await blackbox(text);
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

module.exports = router;