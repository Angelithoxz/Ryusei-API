const { spawn } = require('child_process');
const chalk = require('chalk');
const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const { resetKeys } = require('./database/db');

function start() {
//  console.clear();
    global.host = "https://app.ryuseiclub.xyz"
  console.log(chalk.bgMagentaBright.white.bold('\n   ✨ Iniciando Ryusei API ✨\n'));

  const server = spawn('node', ['server.js'], { stdio: 'inherit' });

  server.on('exit', (code) => {
    console.error(
      chalk.redBright(`⚠️  El servidor se cerró con código ${code}. Reiniciando en 3 segundos...\n`)
    );
    setTimeout(start, 3000);
  });
}

cron.schedule('0 0 * * *', () => {
  const now = dayjs().tz('America/Mexico_City');
  const total = resetKeys();
  const next = now.add(1, 'day').startOf('day');
  const diff = next.diff(now, 'seconds');
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  const prh = `${hours}h ${minutes}m ${seconds}s`;

  console.log(
    chalk.blueBright.bold('I N F O :') +
    chalk.white(` Se ha restablecido el límite de `) +
    chalk.greenBright(`${total}`) +
    chalk.white(` apikeys gratis. Próximo reinicio en `) +
    chalk.yellow(prh)
  );
}, {
  timezone: 'America/Mexico_City'
});

start();