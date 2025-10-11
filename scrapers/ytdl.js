let axios = require('axios')
let crypto = require('crypto')

const ytdl = {
    api: {
        base: "https://media.savetube.me/api",
        info: "/v2/info",
        download: "/download",
        cdn: "/random-cdn"
    },

    headers: {
        'accept': '/',
        'content-type': 'application/json',
        'origin': 'https://yt.savetube.me',
        'referer': 'https://yt.savetube.me/',
        'user-agent': 'Postify/1.0.0'
    },

    formats: ['144', '240', '360', '480', '720', '1080'],

    crypto: {
        hexToBuffer: (hexString) => {
            return Buffer.from(hexString.match(/.{1,2}/g).join(''), 'hex');
        },

        decrypt: async (enc) => {
            try {
                const secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
                const data = Buffer.from(enc, 'base64');
                const iv = data.slice(0, 16);
                const content = data.slice(16);
                const key = ytdl.crypto.hexToBuffer(secretKey);

                const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
                let decrypted = decipher.update(content);
                decrypted = Buffer.concat([decrypted, decipher.final()]);

                return JSON.parse(decrypted.toString());
            } catch (error) {
                throw new Error(`${error.message}`);
            }
        }
    },

    isUrl: (str) => {
        try {
            new URL(str);
            return /youtube\.com|youtu\.be/.test(str);
        } catch (_) {
            return false;
        }
    },

    youtube: (url) => {
        const patterns = [
            /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /youtu\.be\/([a-zA-Z0-9_-]{11})/
        ];
        for (let pattern of patterns) {
            if (pattern.test(url)) return url.match(pattern)[1];
        }
        return null;
    },

    request: async (endpoint, data = {}, method = 'post') => {
        try {
            const {
                data: response
            } = await axios({
                method,
                url: `${endpoint.startsWith('http') ? '' : ytdl.api.base}${endpoint}`,
                data: method === 'post' ? data : undefined,
                params: method === 'get' ? data : undefined,
                headers: ytdl.headers
            });

            return {
                status: true,
                code: 200,
                data: response
            };
        } catch (error) {
            return {
                status: false,
                code: error.response?.status || 500,
                error: error.message
            };
        }
    },

    getCDN: async () => {
        const response = await ytdl.request(ytdl.api.cdn, {}, 'get');

        if (!response.status) return response;
        return {
            status: true,
            code: 200,
            data: response.data.cdn
        };
    },

    d: async (link, format) => {
        if (!ytdl.isUrl(link)) {
            return {
                status: false,
                code: 400,
                error: "URL inválida. Prueba con una URL de YouTube."
            };
        }

        const id = ytdl.youtube(link);
        if (!id) {
            return {
                status: false,
                code: 400,
                error: "No se pudo obtener el ID del video."
            };
        }

        try {
            const cdnx = await ytdl.getCDN();
            if (!cdnx.status) return cdnx;
            const cdn = cdnx.data;

            const videoInfo = await ytdl.request(`https://${cdn}${ytdl.api.info}`, {
                url: `https://www.youtube.com/watch?v=${id}`
            });

            if (!videoInfo.status) return videoInfo;

            const decrypted = await ytdl.crypto.decrypt(videoInfo.data.data);

            const downloadData = await ytdl.request(`https://${cdn}${ytdl.api.download}`, {
                id: id,
                downloadType: 'video',
                quality: format,
                key: decrypted.key
            });

            if (!downloadData.data.data || !downloadData.data.data.downloadUrl) {
                return {
                    status: false,
                    code: 500,
                    error: "No se pudo obtener el enlace de descarga."
                };
            }

            return {
                status: true,
                creator: "Angelithoxyz",
                code: 200,
                result: {
                    title: decrypted.title || "Null",
                    format: format + "p",
                    dl_url: downloadData.data.data.downloadUrl
                }
            };

        } catch (error) {
            return {
                status: false,
                code: 500,
                error: error.message
            };
        }
    }
};

module.exports = { ytdl };
