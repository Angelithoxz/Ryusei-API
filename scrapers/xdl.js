const { fetch } = require('undici');
const cheerio = require('cheerio');

class Xnxx {
    search = async function (query) {
        try {
            const page = Math.floor(3 * Math.random()) + 1;
            const resp = await fetch(`https://www.xnxx.com/search/${query}/${page}`);
            const $ = cheerio.load(await resp.text());
            
            const results = [];
            $('div[id*="video"]').each((_, bkp) => {
                const title = $(bkp).find('.thumb-under p:nth-of-type(1) a').text().trim()
                const views = $(bkp).find('.thumb-under p.metadata span.right').contents().not('span.superfluous').text().trim()
                const resolution = $(bkp).find('.thumb-under p.metadata span.video-hd').contents().not('span.superfluous').text().trim()
                const duration = $(bkp).find('.thumb-under p.metadata').contents().not('span').text().trim()
                const cover = $(bkp).find('.thumb-inside .thumb img').attr('data-src')
                const url = $(bkp).find('.thumb-inside .thumb a').attr('href').replace("/THUMBNUM/", "/")
                
                results.push({ 
                    title, 
                    views, 
                    resolution, 
                    duration, 
                    cover, 
                    url: `https://xnxx.com${url}`
                })
            });
            
            return results;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    dl = async function (url) {
        try {
            const resp = await fetch(url);
            const $ = cheerio.load(await resp.text());
    
            const scriptContent = $('#video-player-bg > script:nth-child(6)').html();
            const extractData = (regex) => (scriptContent.match(regex) || [])[1];
    
            const videos = {
                low: extractData(/html5player\.setVideoUrlLow\('(.*?)'\);/),
                high: extractData(/html5player\.setVideoUrlHigh\('(.*?)'\);/),
                HLS: extractData(/html5player\.setVideoHLS\('(.*?)'\);/)
            }
            
            const thumb = extractData(/html5player\.setThumbUrl\('(.*?)'\);/)
    
            return {
                videos,
                thumb
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

class Xvideos {
    search = async function (q) {
        try {
            const page = Math.floor(3 * Math.random()) + 1;
            const resp = await fetch(`https://www.xvideos.com/?k=${q}&p=${page}`)
            const $ = cheerio.load(await resp.text())
            
            const res = []
            $('div[id*="video"]').each((_, bkp) => {
                const title = $(bkp).find('.thumb-under p.title a').contents().not('span').text().trim()
                const resolution = $(bkp).find('.thumb-inside .thumb span').text().trim()
                const duration = $(bkp).find('.thumb-under p.metadata span.duration').text().trim()
                const artist = $(bkp).find('.thumb-under p.metadata a span.name').text().trim()
                const cover = $(bkp).find('.thumb-inside .thumb img').attr('data-src')
                const url = $(bkp).find('.thumb-inside .thumb a').attr('href')
                
                res.push({
                    title,
                    resolution,
                    duration,
                    artist,
                    cover,
                    url: 'https://www.xvideos.com' + url
                })
            })
            
            return res
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    dl = async function (url) {
        try {
            const resp = await fetch(url);
            const $ = cheerio.load(await resp.text());
    
            const scriptContent = $('#video-player-bg > script:nth-child(6)').html();
            const extractData = (regex) => (scriptContent.match(regex) || [])[1];
    
            const videos = {
                low: extractData(/html5player\.setVideoUrlLow\('(.*?)'\);/),
                high: extractData(/html5player\.setVideoUrlHigh\('(.*?)'\);/),
                HLS: extractData(/html5player\.setVideoHLS\('(.*?)'\);/)
            }
            
            const thumb = extractData(/html5player\.setThumbUrl\('(.*?)'\);/)
    
            return {
                videos,
                thumb
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
}
module.exports = { Xvideos, Xnxx }