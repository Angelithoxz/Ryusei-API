const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function upscale(url) {
  if (!/^https?:\/\//.test(url)) throw new Error('URL inválida');

  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo descargar la imagen desde la URL');
  const buffer = await response.buffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.split('/')[1] || 'jpg';

  const form = new FormData();
  form.append('image', buffer, {
    filename: `image.${ext}`,
    contentType
  });
  form.append('recolor', '2');

  const headers = {
    ...form.getHeaders(),
    'accept': 'application/json',
    'x-client-version': 'web',
    'x-locale': 'en'
  };

  const res = await fetch('https://api2.pixelcut.app/image/upscale/v1', {
    method: 'POST',
    headers,
    body: form
  });
  const json = await res.json();
  if (!json?.result_url?.startsWith('http')) {
    throw new Error('No se recibió una URL válida del resultado');
  }
  const resultRes = await fetch(json.result_url);
  if (!resultRes.ok) throw new Error('No se pudo descargar la imagen mejorada');
  const resultBuffer = await resultRes.buffer();
  const randomName = crypto.randomBytes(8).toString('hex');
  const fileName = `upscale-${randomName}.${ext}`;
  const filePath = path.join(__dirname, '../downloads', fileName);
  fs.writeFileSync(filePath, resultBuffer);
  return filePath;
}

module.exports = { upscale };