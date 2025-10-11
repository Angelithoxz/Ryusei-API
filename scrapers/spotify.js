const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const path = require('path');

const axios = require('axios')
const FormData = require('form-data')
const WebSocket = require('ws')
const cheerio = require('cheerio')
let { fetch } = require("undici")

const s = {
    tools: {
        async hit(description, url, options, returnType = "text") {
            try {
                const response = await fetch(url, options)
                if (!response.ok) throw Error(`${response.status} ${response.statusText}\n${await response.text() || `(response body kosong)`}`)
                try {
                    if (returnType == "text") {
                        const data = await response.text()
                        return { data, response }
                    } else if (returnType == "json") {
                        const data = await response.json()
                        return { data, response }
                    } else {
                        throw Error(`invalid returnType param.`)
                    }
                } catch (e) {
                    throw Error(`gagal mengubah return type menjadi ${returnType}. ${e.message}`)
                }
            } catch (e) {
                throw Error(`hit ${description} failed. ${e.message}`)
            }
        }
    },

    get baseUrl() {
        return "https://spotisongdownloader.to"
    },
    get baseHeaders() {
        return {
            "accept-encoding": "gzip, deflate, br, zstd",
            "user-agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"
        }
    },

    // this function is to get cookie from homepage
    async getCookie() {
        const url = this.baseUrl
        const headers = this.baseHeaders
        const { response } = await this.tools.hit(`homepage`, url, { headers })
        let cookie = response?.headers?.getSetCookie()?.[0]?.split("; ")?.[0]
        if (!cookie?.length) throw Error(`gagal mendapatkan kuki`)
        cookie += "; _ga=GA1.1.2675401.1754827078"
        console.log(`hit ${url}`)
        return { cookie }
    },

    // this function is to register obtained cookie just like cookie validation
    async ifCaptcha(gcObject) {
        const pathname = '/ifCaptcha.php'
        const url = new URL(pathname, this.baseUrl)
        const headers = {
            "referer": new URL(this.baseUrl).href,
            ... gcObject,
            ... this.baseHeaders
        }
        const { data } = await this.tools.hit(`ifCaptcha`, url, { headers })
        console.log(`hit ${pathname}`)
        return headers
    },

    // this function is to retrive single track information/metadata
    async singleTrack(spotifyTrackUrl, icObject) {
        const pathname = '/api/composer/spotify/xsingle_track.php'
        const url = new URL(pathname, this.baseUrl)
        url.search = new URLSearchParams({
            url: spotifyTrackUrl
        })
        const headers = icObject
        const { data } = await this.tools.hit(`single track`, url, { headers }, 'json')
        console.log(`hit ${pathname}`)
        return data
    },

    //you need to this this api first to gain acces to next request
    async singleTrackHtml(stObject, icObj) {
        const payload = []
        
        payload.push(stObject.song_name)
        payload.push(stObject.duration)
        payload.push(stObject.img)
        payload.push(stObject.artist)
        payload.push(stObject.url)
        payload.push(stObject.album_name)
        payload.push(stObject.released)

        const pathname = '/track.php'
        const url = new URL(pathname, this.baseUrl)
        const headers = icObj
        const body = new URLSearchParams({
            data: JSON.stringify(payload)
        })
        const { data } = await this.tools.hit(`track html`, url, { headers, body, method: 'post' })
        console.log(`hit ${pathname}`)
        return data
    },

    //actual hit to get download url
    async downloadUrl(spotifyTrackUrl, icObj, stObj) {
        const pathname = '/api/composer/spotify/ssdw23456ytrfds.php'
        const url = new URL(pathname, this.baseUrl)
        const headers = icObj
        const body = new URLSearchParams({
            "song_name": "",
            "artist_name": "",
            "url": spotifyTrackUrl,
            "zip_download": "false",
            "quality": "m4a"
        })
        const { data } = await this.tools.hit(`get download url`, url, { headers, body, method: 'post' }, 'json')
        const result = {...data, ...stObj}
        console.log(`hit ${pathname}`)
        return result
    },

    async download(spotifyTrackUrl) {
        // validate spotify url (bikin sendiri ya haha)
        const gcObj = await this.getCookie()
        const icObj = await this.ifCaptcha(gcObj)
        const stObj = await this.singleTrack(spotifyTrackUrl, icObj)
        const sthObj = await this.singleTrackHtml(stObj,icObj)
        const dlObj = await this.downloadUrl(spotifyTrackUrl, icObj, stObj)
        return dlObj
    }
}

async function Spotifyv2(url) {
let info = await s.download(url)
let data = {
status: true,
creator: "i'm Fz ~",
data: {
title: info.song_name,
artist: info.artist,
image: info.img,
duration: info.duration,
album: info.album_name,
dl_url: info.dlink
}
}
return data
}



async function save(url, ext) {
  return new Promise((resolve, reject) => {
    const randomName = "sylph-" + crypto.randomBytes(100).toString('hex');
    const filePath = `./downloads/${randomName}.${ext}`;
    const file = fs.createWriteStream(filePath);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();

        setTimeout(() => {
          fs.unlink(filePath, () => {});
        }, 5 * 60 * 1000);

        resolve({ file: filePath, key: randomName });
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
}

const client_id = "acc6302297e040aeb6e4ac1fbdfd62c3";
const client_secret = "0e8439a1280a43aba9a5bc0a16f3f009";
const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

async function spotifyCreds() {
    try {
        const response = await axios.post(
            TOKEN_ENDPOINT,
            "grant_type=client_credentials", {
                headers: {
                    Authorization: "Basic " + basic
                },
            },
        );
        return {
            status: true,
            data: response.data,
        };
    } catch (error) {
        return {
            status: false,
            msg: "Failed to retrieve Spotify credentials."
        };
    }
}

const toTime = (ms) => {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
};

async function search(query, type = "track", limit = 20) {
        try {
            const creds = await spotifyCreds();
            if (!creds.status) return creds;

            const response = await axios.get(
                `https://api.spotify.com/v1/search?query=${encodeURIComponent(query)}&type=${type}&offset=0&limit=${limit}`, {
                    headers: {
                        Authorization: "Bearer " + creds.data.access_token
                    },
                },
            );

            if (
                !response.data[type + "s"] ||
                !response.data[type + "s"].items.length
            ) {
                return {
                    msg: "Music not found!"
                };
            }

            return response.data[type + "s"].items.map((item) => ({
                title: item.name,
                id: item.id,
                duration: toTime(item.duration_ms),
                artist: item.artists.map((artist) => artist.name).join(" & "),
                url: item.external_urls.spotify,
            }));
        } catch (error) {
            return {
                status: false,
                msg: "Error searching for music. " + error.message,
            };
      }
 };
class SpotMate {
  constructor() {
    this._cookie = null;
    this._token = null;
  }

  async _visit() {
    try {
      const response = await axios.get('https://spotmate.online/en', {
        headers: {
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        },
      });

      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        this._cookie = setCookieHeader
          .map((cookie) => cookie.split(';')[0])
          .join('; ');
      }

      const $ = cheerio.load(response.data);
      this._token = $('meta[name="csrf-token"]').attr('content');

      if (!this._token) {
        throw new Error('Token CSRF tidak ditemukan.');
      }

      console.log('Berhasil mendapatkan cookie dan token.');
    } catch (error) {
      throw new Error(`Gagal mengunjungi halaman: ${error.message}`);
    }
  }

  async info(spotifyUrl) {
    if (!this._cookie || !this._token) {
      await this._visit();
    }

    try {
      const response = await axios.post(
        'https://spotmate.online/getTrackData',
        { spotify_url: spotifyUrl },
        {
          headers: this._getHeaders(),
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Gagal mendapatkan info track: ${error.message}`);
    }
  }

  async convert(spotifyUrl) {
    if (!this._cookie || !this._token) {
      await this._visit();
    }

    try {
      const response = await axios.post(
        'https://spotmate.online/convert',
        { urls: spotifyUrl },
        {
          headers: this._getHeaders(),
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Gagal mengonversi track: ${error.message}`);
    }
  }

  clear() {
    this._cookie = null;
    this._token = null;
    console.log('Cookie dan token telah dihapus.');
  }

  _getHeaders() {
    return {
      'authority': 'spotmate.online',
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'content-type': 'application/json',
      'cookie': this._cookie,
      'origin': 'https://spotmate.online',
      'referer': 'https://spotmate.online/en',
      'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
      'x-csrf-token': this._token,
    };
  }
}


async function Spotify(url) {
  const spotMate = new SpotMate();
  try {
    const info = await spotMate.info(url);
    const dl = await spotMate.convert(url);

    const data = info
    const firstArtist = data.artists?.[0]?.name || 'Unknown';
    const durationMs = data.duration_ms || 0;

    return {
      status: true,
      creator: "i'm Fz ~",
      data: {
      title: data.name,
      artist: firstArtist,
      duration: (durationMs / 60000).toFixed(2),
      img: data.album.images[0].url || null,
      url: data.external_urls?.spotify || url,
      album: data.album?.name || data.name || null,
      dl_url: dl.url || null,
      preview: data.preview_url || null
      }
    };
  } catch (error) {
    console.error('Error:', error);
    return { status: false, msg: "Ocurrió un error." };
  }
}

async function spoti(url) {
    try {
        if (!url.includes('open.spotify.com')) throw new Error('Invalid url.');
        
        const rynn = await axios.get('https://spotdl.io/', {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(rynn.data);
        
        const api = axios.create({
            baseURL: 'https://spotdl.io',
            headers: {
                cookie: rynn.headers['set-cookie'].join('; '),
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'x-csrf-token': $('meta[name="csrf-token"]').attr('content')
            }
        });
        
        const [{ data: meta }, { data: dl }] = await Promise.all([
            api.post('/getTrackData', { spotify_url: url }),
            api.post('/convert', { urls: url })
        ]);
        
        return {
            status: true,
            creator: "i'm Fz ~",
            data: {
            ...meta,
            dl_url: dl.url
               }
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { Spotifyv2, search, spoti }