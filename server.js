 const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const favicon = require("serve-favicon");
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3024;

/*************/
const download = require('./routes/downloader');
const search = require('./routes/search');
const ias = require('./routes/ias');
const tools = require('./routes/tools');
const other = require('./routes/other');
const main = require('./routes/main');
/*************/

const settingsPath = path.join(__dirname, './src/settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(express.static("public"));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/', express.static(path.join(__dirname, 'views')));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/public/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/public/css', express.static(path.join(__dirname, 'public', 'css')));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'sylph-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (data && typeof data === 'object') {
      const responseData = {
        status: data.status,
        creator: settings.apiSettings.creator,
        ...data
      };
      return originalJson.call(this, responseData);
    }
    return originalJson.call(this, data);
  };
  next();
});

let totalReq = 0;
const endpointHits = new Map();
const apikeyUsage = new Map();

app.use((req, res, next) => {
  const endpoint = req.originalUrl.split('?')[0];
  const apikey = req.query.apikey || req.body?.apikey || req.headers['x-api-key'];
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (endpoint !== '/req' && endpoint !== '/stats') totalReq++;
  endpointHits.set(endpoint, (endpointHits.get(endpoint) || 0) + 1);
  if (apikey) {
    apikeyUsage.set(apikey, (apikeyUsage.get(apikey) || 0) + 1);
  }
  let visitCount = 0;

  console.log(chalk.green("🌱 Solicitud al endpoint:"), chalk.blue(endpoint));
  console.log(chalk.cyan("🌿 IP:"), chalk.red(ip));
  console.log(chalk.yellow("------"));
visitCount++

  next();
});

app.get("/req", (req, res) => {
  res.json({
    creator: "Angelithoxyz",
    total: totalReq
  });
});

app.get("/stats", (req, res) => {
  const ignoredEndpoints = ["/req", "/stats"];

  const filteredEndpoints = [...endpointHits.entries()].filter(
    ([endpoint]) => !ignoredEndpoints.includes(endpoint)
  );

  const topEndpoint = filteredEndpoints.sort((a, b) => b[1] - a[1])[0];
  const topApikey = [...apikeyUsage.entries()].sort((a, b) => b[1] - a[1])[0];

  res.json({
    status: true,
    TReq: totalReq,
    MRE: topEndpoint
      ? { endpoint: topEndpoint[0], hits: topEndpoint[1] }
      : null,
    MUA: topApikey
      ? { apikey: topApikey[0], uses: topApikey[1] }
      : null
  });
});


const os = require('os');
const startTime = Date.now();

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}:${hours}:${minutes}:${secs}`;
}

function getCpuUsage(callback) {
    const startMeasure = cpuAverage();

    setTimeout(() => {
        const endMeasure = cpuAverage();

        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;

        const percentageCPU = 100 - Math.floor(100 * idleDifference / totalDifference);

        callback(percentageCPU.toFixed(2) + '%');
    }, 1000);
}

function cpuAverage() {
    const cpus = os.cpus();

    let totalIdle = 0, totalTick = 0;

    cpus.forEach(core => {
        for (type in core.times) {
            totalTick += core.times[type];
        }
        totalIdle += core.times.idle;
    });

    return {
        idle: totalIdle / cpus.length,
        total: totalTick / cpus.length
    };
}

app.get('/api/stats', (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    const totalMemory = os.totalmem() / (1024 * 1024 * 1024);
    const freeMemory = os.freemem() / (1024 * 1024 * 1024);
    const usedMemory = totalMemory - freeMemory;
    const cpuCores = os.cpus().length;
    const cpu = os.cpus()[0].model;
    const osPlatform = `${os.platform()} ${os.release()}`;

    const totalRequests = 0;
    const uniqueVisitors = visitCount || 0;

    getCpuUsage((cpuUsage) => {
        const response = {
            status: true,
            creator: "I'm Zyxl",
            ip: req.ip.replace(/^::ffff:/, ''),
            totalRequests,
            uniqueVisitors,
            server: {
                os: osPlatform,
                platform: os.platform(),
                uptime: formatUptime(uptime),
                cpu,
                cpuCores,
                memory: {
                    total: `${totalMemory.toFixed(2)} GB`,
                    used: `${usedMemory.toFixed(2)} GB`,
                    free: `${freeMemory.toFixed(2)} GB`,
                    usage: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`
                },
                cpuUsage
            }
        };

        res.json(response);
    });
});


/******[ RUTAS ]*******/ 
app.use('/', main);
app.use('/', download);
app.use('/', search);
app.use('/', ias);
app.use('/', other);
app.use('/', tools);
app.get('/store', (req, res) => { res.sendFile(path.join(__dirname, 'views', 'store.html'));
});
/**********************/

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'views', '404.html')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
});

app.listen(PORT, () => console.log(chalk.cyan(`🚀 Servidor en ejecución en el puerto : ${PORT}`)));