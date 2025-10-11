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

  console.log(chalk.green("🌱 Solicitud al endpoint:"), chalk.blue(endpoint));
  console.log(chalk.cyan("🌿 IP:"), chalk.red(ip));
  console.log(chalk.yellow("------"));

  next();
});

app.get("/req", (req, res) => {
  res.json({
    creator: "I'm Fz ~",
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