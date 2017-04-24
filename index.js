const url = require('url')
const querystring = require('querystring')
const cipher = require('./simple-encryption')(process.env.SECRET_AUTH_KEY)
const fs = require('fs')

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

module.exports = async (req, res) => {
  const {pathname, query} = url.parse(req.url, true)
  if (pathname === '/login' && query.token.length >= 32) {
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
    return
  }

  if (pathname === '/client.js') {
    const src = await readFile('client.js')
    res.setHeader('content-type', 'text/javascript')
    res.end(src)
    return
  }

  const src = await readFile('client.html')
  res.setHeader('content-type', 'text/html')
  res.end(src)
}
