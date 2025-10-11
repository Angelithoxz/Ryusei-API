let axios = require("axios")

async function tts(query) {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://tikwm.com/api/feed/search',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': 'current_language=en',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
      },
      data: {
        keywords: query,
        count: 20,
        cursor: 0,
        HD: 1
      }
    });
    const videos = response.data.data.videos;
    if (videos.length === 0) throw new Error("No se encontraron videos para esa búsqueda.");
    const shuffled = videos.sort(() => 0.5 - Math.random()).slice(0, 5);

  return {
      status: true,
      creator: "I'm Fz~",
      data: shuffled
    };
  } catch (error) {
    throw error;
  }
}

module.exports = { tts }