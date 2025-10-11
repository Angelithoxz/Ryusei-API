const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const axios = require("axios");
const { checkKey, getUser, resDefault } = require('../database/db');
let creator = "i'm Fz ~"

router.get('/dl', (req, res) => {
  const key = req.query.key;
  if (!key) return res.status(400).json({ error: 'Missing key parameter' });

  const folder = path.join(__dirname, '../downloads');
  fs.readdir(folder, (err, files) => {
    if (err) return res.status(500).json({ error: 'Error reading downloads folder' });

    const fileName = files.find(f => f.startsWith(key));
    if (!fileName) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(folder, fileName);
    res.sendFile(filePath, err => {
      if (!err) setTimeout(() => fs.unlink(filePath, () => {}), 5 * 60 * 1000);
    });
  });
});
/******/
router.get('/ikey', (req, res) => {
  const apikey = req.query.apikey;
  if (!apikey) return res.json({ status: false, message: 'Falta el parámetro apikey' });

  const user = getUser(apikey);
  if (!user) return res.json(resDefault.invalidKey);

  if (user.banned) {
    return res.json({ status: false, message: 'The API key you entered is suspended. If you believe this is an error, please contact the API owner..' });
  }
  let profileUrl = user.profile_url;
  let role = 'free';
  if (user.isAdmin) {
    role = 'admin';
  } else if (!user.apikey.startsWith('sylph-') && !user.apikey.startsWith('sylphy-')) {
    role = 'premium';
  }

  return res.json({
    status: true,
    creator,
    apikey: user.apikey,
    role,
    limit: user.max_limit,
    email: user.email,
    name: user.username,
    profileUrl
  });
});

router.get("/nsfw/:type", async (req, res) => {
  const { type } = req.params;
  const filePath = path.join(__dirname, `../JSON/${type}.json`);
  const user = checkKey(req, res);
if (!user) return;

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: false,
      message: `La categoría "${type}" no existe.`,
    });
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(500).json({
        status: false,
        message: `La categoría "${type}" está vacía o malformada.`,
      });
    }
    const shuffled = data.sort(() => 0.5 - Math.random());

    for (const url of shuffled) {
      try {
        const head = await axios.head(url, { timeout: 5000 });
        const mime = head.headers["content-type"] || "application/octet-stream";

        return res.json({
          status: true,
          creator: "I'm Fz ~",
          data: {
            url,
            type,
            mime
          }
        });
      } catch (e) {
        console.log(`URL inválida: ${url}`);
        continue;
      }
    }
    return res.status(500).json({
      status: false,
      message: "No se pudo obtener una URL válida.",
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error al procesar la solicitud.",
      error: err.message,
    });
  }
});

const reactions = {
  cry: "llorar",
  cuddle: "acurrucar",
  hug: "abrazar",
  kiss: "besar",
  lick: "lamer",
  pat: "acariciar la cabeza",
  smug: "presumido",
  blush: "sonrojarse",
  smile: "sonreír",
  wave: "saludar con la mano",
  highfive: "chocar los cinco",
  handhold: "tomarse de la mano",
  nom: "morder suavemente",
  bite: "morder",
  glomp: "abrazo fuerte y repentino",
  slap: "bofetada",
  kick: "patear",
  happy: "feliz",
  wink: "guiñar el ojo",
  poke: "picar con el dedo",
  dance: "bailar",
  cringe: "vergüenza ajena"
}

router.get('/sfw/reaction', async (req, res) => {
  const type= req.query.type
  if (type === 'list') {
    return res.json({
      status: true,
      creator: "I'm Fz ~",
      reactions
    })
  }
  if (!reactions[type]) {
    return res.status(400).json({
      status: false,
      message: 'Tipo de reacción no válida. Usa /reaction/list para ver las disponibles.'
    })
  }  
  const user = checkKey(req, res);
if (!user) return;
  const { react } = require("../scrapers/react");
  const videoPath = await react(type)
  if (!videoPath) {
    return res.status(500).json({
      status: false,
      message: 'No se pudo procesar la reacción.'
    })
  }
  res.sendFile(path.resolve(videoPath))
})

router.get('/stickerly/search', async (req, res) => { 
  const q = req.query.q
  const quality = req.query.quality
  if (!q) return res.json({ status: false, creator, mensaje: 'Falta el parámetro q' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { StickerLy} = require("../scrapers/stickerly.js")
    const sticker = new StickerLy()
    const result = await sticker.search(q)

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

router.get('/stickerly/detail', async (req, res) => {
  const url = req.query.url
  const quality = req.query.quality  
  if (!url) return res.json({ status: false, creator, mensaje: 'Falta el parámetro url' });
  const user = checkKey(req, res);
if (!user) return;
  try {
    const { StickerLy } = require("../scrapers/stickerly.js")
    const sticker = new StickerLy()
    const result = await sticker.detail(url)
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