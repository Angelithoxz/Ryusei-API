const path = require('path')
const Database = require('better-sqlite3')

const dbPath = path.join(__dirname, 'users.db')
const db = new Database(dbPath)

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    apikey TEXT UNIQUE NOT NULL,
    max_requests INTEGER DEFAULT 20,
    is_admin INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    profile_url TEXT,
    premium INTEGER DEFAULT 0
  )
`).run()

const creator = "Angelithoxyz"

const resDefault = {
  keyBanned: {
    status: false,
    creator,
    code: 403,
    message: `The user's API key has been suspended. If you believe this was a mistake, please contact the API owner.`
  },
  invalidKey: {
    status: false,
    creator,
    code: 406,
    message: `Invalid API key.`
  },
  noLimit: {
    status: false,
    creator,
    message: 'API key usage limit reached.'
  },
  error: {
    status: false,
    creator,
    message: 'An error occurred, please try again..'
  }
}

function getUser(apikey) {
  const stmt = db.prepare(`
    SELECT username, email, apikey, max_requests AS max_limit, is_admin, banned, profile_url FROM users
    WHERE apikey = ?
  `)
  const user = stmt.get(apikey)
  if (!user) return null
  user.isAdmin = !!user.is_admin
  user.profileUrl = user.profile_url
  delete user.is_admin
  delete user.profile_url
  return user
}

function checkKey(req, res) {
  const apikey = req.query.apikey
  if (!apikey) {
    res.json(resDefault.invalidKey)
    return null
  }

  const user = getUser(apikey)

  if (!user) {
    res.json(resDefault.invalidKey)
    return null
  }

  if (user.banned) {
    res.json(resDefault.keyBanned)
    return null
  }

  if (user.max_limit <= 0) {
    res.json(resDefault.noLimit)
    return null
  }

  db.prepare(`UPDATE users SET max_requests = max_requests - 1 WHERE apikey = ?`).run(apikey)
  user.max_limit--
  return user
}

function newUser({ username, email, password, apikey, limit = 20, isAdmin = false, banned = false, profileUrl = null }) {
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password, apikey, max_requests, is_admin, banned, profile_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(username, email, password, apikey, limit, isAdmin ? 1 : 0, banned ? 1 : 0, profileUrl)
}

function updateUser(username, field, value) {
  const allowedFields = ['username', 'email', 'password', 'apikey', 'max_requests', 'is_admin', 'banned', 'profile_url']
  if (!allowedFields.includes(field)) throw new Error('Invalid field')
  const stmt = db.prepare(`UPDATE users SET ${field} = ? WHERE username = ?`)
  return stmt.run(value, username)
}

function getAllUsers() {
  const stmt = db.prepare(`
    SELECT username, email, apikey, max_requests AS max_limit, is_admin, banned, profile_url, premium FROM users
  `)
  const users = stmt.all()
  return users.map(u => {
    u.isAdmin = !!u.is_admin
    u.profileUrl = u.profile_url
    delete u.is_admin
    delete u.profile_url
    return u
  })
}

function UserEmail(email) {
  const stmt = db.prepare(`
    SELECT username, email, password, apikey, max_requests AS max_limit, is_admin, banned, profile_url FROM users
    WHERE email = ?
  `)
  const user = stmt.get(email)
  if (!user) return null
  user.isAdmin = !!user.is_admin
  user.profileUrl = user.profile_url
  delete user.is_admin
  delete user.profile_url
  return user
}

function resetKeys(limit = 20) {
  const stmt = db.prepare(`
    UPDATE users
    SET max_requests = ?
    WHERE (apikey LIKE 'sylph-%' OR apikey LIKE 'sylphy-%')
      AND max_requests < ?
  `)
  const result = stmt.run(limit, limit)
  console.log(`Se ha restablecido el límite de las apikeys gratis. Total: ${result.changes} apikeys restablecidas con éxito!`)
  return result.changes
}

module.exports = {
  getUser,
  checkKey,
  newUser,
  updateUser,
  getAllUsers,
  UserEmail,
  resetKeys,
  resDefault
}