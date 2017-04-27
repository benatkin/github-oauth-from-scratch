const {send} = require('micro')
const url = require('url')
const querystring = require('querystring')
const cipher = require('./simple-encryption')(process.env.SECRET_AUTH_KEY)
const fs = require('fs')
const request = require('superagent')
const winston = require('winston')
require('winston-loggly-bulk')
 
winston.add(winston.transports.Loggly, {
  token: process.env.LOGGLY_TOKEN,
  subdomain: process.env.LOGGLY_SUBDOMAIN,
  tags: ['github-oauth-from-scratch'],
  json: true
})

const fileCache = {}

function readFile(file) {
  if (fileCache[file]) return fileCache[file]
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) return reject(err)
      fileCache[file] = data
      return resolve(data)
    })
  })
}

const routes = {
  '/login': async (req, res, query) => {
    const token = query.token
    if (!(token && token.length >= 32)) {
      throw new Error('Token must be given and at least 32 characters long')
    }
    const redirEndpoint = 'https://github.com/login/oauth/authorize'
    const queryParams = {
      client_id: process.env.GITHUB_CLIENT_ID,
      scope: 'gist',
      state: cipher.encrypt(query.token)
    }
    res.statusCode = 302
    const redirUrl = redirEndpoint + '?' + querystring.stringify(queryParams)
    res.setHeader('location', redirUrl)
    res.end()
  },
  '/oauth/callback': async (req, res, query) => {
    const {code, state} = query
    const clientReq = request.post('https://github.com/login/oauth/access_token')
      .timeout(5000)
      .type('form')
      .send({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state
      })
    const clientRes = await clientReq
    const oauthResponse = cipher.encrypt(`${state};${clientRes.body.access_token}`)
    res.statusCode = 302
    res.setHeader('Set-Cookie', `oauthResponse=${encodeURIComponent(oauthResponse)}; Secure; Path=/; Max-Age=300`)
    res.setHeader('Location', '/')
    res.end()
  },
  '/client.js': async (req, res) => {
    const src = await readFile('client.js')
    res.setHeader('content-type', 'text/javascript')
    res.end(src)
  },
  '/': async (req, res) => {
    const src = await readFile('client.html')
    res.setHeader('content-type', 'text/html')
    res.end(src)
  }
}

module.exports = async (req, res) => {
  const {pathname, query} = url.parse(req.url, true)
  try {
    const route = routes[pathname]
    if (route) {
      await route(req, res, query)
    } else {
      send(res, 404, {error: 'route not found'})
    }
  } catch (err) {
    try {
      winston.log('error', `Error at ${pathname}: ${err}`)
    } catch (err) {
      send(res, 500, {error: `error logging request: ${err}`})
    }
    send(res, 500, {error: 'error in app'})
  }
}
