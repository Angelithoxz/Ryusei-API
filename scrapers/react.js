const axios = require('axios')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { exec } = require('child_process')

async function react(type) {
  try {
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${type}`)
    const gifUrl = data.url
    const baseName = `reaction-${crypto.randomBytes(6).toString("hex")}`
    const gifPath = path.resolve('./downloads', `${baseName}.gif`)
    const mp4Path = path.resolve('./downloads', `${baseName}.mp4`)
    
    const response = await axios.get(gifUrl, { responseType: 'stream' })
    const writer = fs.createWriteStream(gifPath)
    response.data.pipe(writer)

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -y -i "${gifPath}" -preset ultrafast -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${mp4Path}"`,
        (err) => {
          if (err) return reject(err)
          resolve()
        }
      )
    })
    setTimeout(() => {
      fs.unlink(gifPath, () => {})
      fs.unlink(mp4Path, () => {})
    }, 5 * 60 * 1000)

    return mp4Path
  } catch (err) {
    console.error('Error en react():', err)
    return null
  }
}

module.exports = { react }