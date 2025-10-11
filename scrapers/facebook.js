const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const { fetch } = require("undici")

async function Facebook(url) {
    try {
        const response = await fetch("https://anydownloader.com/wp-json/aio-dl/video-data/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": "https://anydownloader.com/",
                "Token": "5b64d1dc13a4b859f02bcf9e572b66ea8e419f4b296488b7f32407f386571a0d"
            },
            body: new URLSearchParams({
                url
            }),
        }, );
        const data = await response.json();
        if (!data.url) return data
        return data;
    } catch (error) {
        console.error("Error fetching data:", );
        throw error
    }
}

async function facebook(url) {
    let results = {};
    while(Object.keys(results).length === 0) {
        let { data } = await axios
            .post(
                "https://getmyfb.com/process",
                `id=${encodeURIComponent(url)}&locale=id`,
                {
                    headers: {
                        "HX-Request": true,
                        "HX-Trigger": "form",
                        "HX-Target": "target",
                        "HX-Current-URL": "https://getmyfb.com/id",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
                        Referer: "https://getmyfb.com/id",
                    },
                },
            ).catch((e) => e.response);

        const $ = cheerio.load(data);

        const caption = $(".results-item-text").text().trim();
        const imageUrl = $(".results-item-image").attr("src");

        let newLinksFound = false;
        let array = []
        $(".results-list li").each(function (i, element) {
            const title = $(element).find(".results-item-text").text().trim();
            const downloadLink = $(element).find("a").attr("href");
            const quality = $(element).text().trim().split("(")[0];
            if(downloadLink) {
                newLinksFound = true;
               array.push(downloadLink);
            }
        });
      results =  {
             title: caption,
             image: imageUrl,
          media: array[0]
       }
     break
    }
    return results
}

const fbdl = async (urlFesnuk) => {
    const r = await fetch(`https://fdown.net/download.php`, {
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            URLz: urlFesnuk
        }),
        method : "post"
    })
    if (!r.ok) throw Error (`${r.status} ${r.statusText} ${(await r.text() || `(respond body kosong)`).substring(0,100)}`)
    const html = await r.text()
    const hd = html.match(/id="hdlink" href="(.+?)" download/)?.[1]?.replaceAll("&amp;","&")
    const sd = html.match(/id="sdlink" href="(.+?)" download/)?.[1]?.replaceAll("&amp;","&")

    if (!hd && !sd) throw Error (`No hay video para descargar`)
    const image = html.match(/<img[^>]+src="([^"]+)"[^>]*class="lib-img-show"/)?.[1]?.replaceAll("&amp;","&")
    
    const duration = html.match(/<strong>Duration:<\/strong>\s*([^<]+)/)?.[1]?.trim()

    return {
     data: {
     duration, 
     hd,
     sd
      }
    }
}

module.exports = { Facebook, facebook, fbdl };