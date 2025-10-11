const axios = require('axios')

async function Terabox(link) {
  try {
    const res = await axios.post('https://teraboxdownloader.online/api.php',
      { url: link },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://teraboxdownloader.online',
          'Referer': 'https://teraboxdownloader.online/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': '*/*'
        }
      }
    )

    const data = res.data
    if (!data?.direct_link) {
      return { error: 'No se encontró ningún enlace de descarga.', debug: data }
    }

    return {
      file_name: data.file_name,
      size: data.size,
      size_bytes: data.sizebytes,
      direct_link: data.direct_link,
      thumb: data.thumb
    }

  } catch (err) {
    return { error: 'No se pudo acceder a la web.', detail: err.message }
  }
}

module.exports = { Terabox }