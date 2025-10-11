const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fetch = require('node-fetch');
const { getAllUsers, newUser, UserEmail, updateUser } = require('../database/db');

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

router.get('/', (req, res) => res.render("index"));

router.get('/home', ensureLogin, async (req, res) => {
  const { username, email, apikey, limit, isAdmin } = req.session.user;
  try {
    const host = req.get('host');
    global.domain = `${req.protocol}://${host}`;
    const response = await fetch(`https://app.ryuseiclub xyz/ikey?apikey=${apikey}`);
    const info = await response.json();
    const usekey = info.limit;
    res.render('home', { username, email, apikey, limit, usekey, is__admin: isAdmin });
  } catch {
    res.render('index', { username, email, apikey, limit, usekey: 'Error' });
  }
});

router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

router.get('/admin', ensureLogin, (req, res) => {
  if (!req.session.user.isAdmin) return res.redirect('/home');
  res.render('admin', { usuario: req.session.user.username });
});

router.get('/profile', ensureLogin, async (req, res) => {
  const { username, email, apikey, limit } = req.session.user;
  try {
    const response = await fetch(`https://app.ryuseiclub.xyz/ikey?apikey=${apikey}`);
    const info = await response.json();
    const usekey = info.limit;
    let name = username;
    let type = info.role;
    let profileUrl = info.profile_url || "https://files.catbox.moe/1i2sl8.jpeg";
    res.render('perfil', { name, email, apikey, limit, profileUrl, usekey, type });
  } catch {
    res.render('perfil', { username, email, apikey, limit, usekey: 'Error' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Error closing session');
    res.redirect('/login');
  });
});

router.post('/register', (req, res) => {
  const { username, email, password, confirmPassword, checkbox } = req.body;
  if (!username || !email || !password || !confirmPassword || !checkbox)
    return res.redirect('/register?error=missing');
  if (password !== confirmPassword)
    return res.redirect('/register?error=invalid');

  const users = getAllUsers();
  if (users.find(u => u.email === email))
    return res.redirect('/register?error=exists');

  const apikey = 'sylphy-' + crypto.randomBytes(2).toString('hex');
  newUser({ username, email, password, apikey, limit: 20, profileUrl: null, banned: false, isAdmin: false });
  res.redirect('/login?success=created');
});

router.post('/login', (req, res) => {
  const { email, password, checkbox } = req.body;
  if (!email || !password || !checkbox)
    return res.redirect('/login?error=missing');

  const user = UserEmail(email);
  if (!user || user.password !== password)
    return res.redirect('/login?error=invalid');

  req.session.user = user;
  const redirectTo = req.session.returnTo || '/home';
  delete req.session.returnTo;
  res.redirect(redirectTo);
});

router.get('/usuarios', (req, res) => {
  try {
    const usuarios = getAllUsers();
    res.json(usuarios);
  } catch {
    res.status(500).send('Error al leer los usuarios');
  }
});

router.get('/users', (req, res) => {
  try {
    const users = getAllUsers();
    let vipCount = 0, freeCount = 0, adminCount = 0;
    for (const user of users) {
      if (user.is_admin || user.isAdmin) adminCount++;
      if (user.apikey?.toLowerCase().startsWith('sylph-') || user.apikey?.toLowerCase().startsWith('sylphy-')) freeCount++;
      else vipCount++;
    }
    const total = vipCount + freeCount;
    res.json({ status: true, users: { VIP: String(vipCount), FREE: String(freeCount), ADMIN: String(adminCount), Total: String(total) } });
  } catch {
    res.status(500).json({ status: false, message: 'Error reading users data' });
  }
});

router.post('/update', (req, res) => {
  let { username, campo, nuevoValor } = req.body;
  if (!username || !campo || nuevoValor === undefined)
    return res.status(400).send('Faltan datos en la solicitud');

  const validFieldsMap = {
    'limit': 'max_requests',
    'isAdmin': 'is_admin',
    'banned': 'banned',
    'email': 'email',
    'profileUrl': 'profile_url',
    'username': 'username',
    'password': 'password',
    'premium': 'premium',
    'apikey': 'apikey'
  };

  const dbField = validFieldsMap[campo];
  if (!dbField) return res.status(400).send('Campo inválido');

  if (campo === 'limit' && isNaN(parseInt(nuevoValor))) return res.status(400).send('El límite debe ser un número');
  if (['isAdmin', 'banned', 'premium'].includes(campo)) nuevoValor = nuevoValor === 'true' ? 1 : 0;
  if (campo === 'email' && !nuevoValor.includes('@')) return res.status(400).send('Correo inválido');
  if (campo === 'profileUrl') {
    const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/;
    if (!urlRegex.test(nuevoValor)) return res.status(400).send('La URL no es válida');
  }

  try {
    updateUser(username, dbField, nuevoValor);
    res.send('Usuario actualizado correctamente');
  } catch {
    res.status(500).send('Error al guardar los cambios');
  }
});

module.exports = router;