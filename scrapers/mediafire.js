const { fetch } = require('undici');
const cheerio = require('cheerio');

async function mediafire(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const scrambledUrl = $('#downloadButton').attr('data-scrambled-url');
    const downloadUrl = scrambledUrl
      ? Buffer.from(scrambledUrl, 'base64').toString('ascii')
      : null;
    const filename = $('.dl-btn-label').attr('title') || null;
    const iconClasses = $('.dl-btn-cont > .icon').attr('class');
    let mimetype = 'unknown/unknown';
    if (iconClasses) {
      const classList = iconClasses.split(' ');
      const mimeClass = classList.find(cls => cls.includes('_'));
      if (mimeClass) {
        mimetype = mimeClass.replace('_', '/');
      }
    }

    return {
      filename,
      mimetype,
      dl_url: downloadUrl,
    };
  } catch (err) {
    return err
  }
}

module.exports =  { mediafire };