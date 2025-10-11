const fetch = require("node-fetch")

async function ytmp3(url) {
let res = await (await fetch(`https://ytdl.sylphy.xyz/download/audio/?url=${url}&mode=url`)).json()
let data = {
 status: true,
 creator: "I'm Fz ~",
 data: res
}
return data
}

async function ytmp4(url, q) {
let res = await (await fetch(`https://ytdl.sylphy.xyz/download/?url=${url}&resolution=${q || 360}&mode=url`)).json()
let data = {
 status: true,
 creator: "I'm Fz ~",
 data: res
}
return data
}

async function Spotify(url) {
let res = await (await fetch(`https://ytdl.sylphy.xyz/spotify/download/audio?url=${url}&mode=url`)).json()
let data = {
 status: true,
 creator: "I'm Fz ~",
 data: res
}
return data
}

module.exports = { Spotify, ytmp3, ytmp4 }