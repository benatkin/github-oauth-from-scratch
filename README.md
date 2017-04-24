# Stateless GitHub OAuth2 from scratch

I'm following the GitHub API docs to implement OAuth2 from scratch, developing it with micro and now.sh.

My plan is to build it without any dependencies, except for the platforms. It's good to work with just the platforms once in a while. The platform docs:

- [now][now] - [secrets][now-secrets]
- [micro][micro]
- [node][node] - [http][node-http], [crypto][node-crypto], [url][node-url]
- [github API][github-api] - [OAuth][github-oauth], [gists][github-gists]
- [OAuth2][oauth2]
- modern browsers - [MDN][mdn]

## Setting up the project

First, install and set up [now][now]. It's extremely easy to set up.

Create a new project, and install `micro`:

```
mkdir github-oauth-from-scratch
npm init -y
npm install micro --save
```

Following the zeit docs, add `micro` as the `start` script:

``` json
{
  "name": "github-oauth-from-scratch",
  "version": "1.0.0",
  "description": "github OAuth2 from scratch, using now and micro",
  "main": "index.js",
  "scripts": {
    "start": "micro",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/benatkin/github-oauth-from-scratch.git"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "micro": "^7.3.2"
  }
}
```

The next thing in the docs is the basic API. The `micro` binary form the node module (in `node_modules/.bin/micro`) loads the `index.js` file (unless another file is specified) and starts an HTTP server with the top-level exported function as an HTTP handler.

To start, just copy the example, put it in a new file called `index.js`, and change it a bit:

``` javascript
const message=`
<!doctype html>
<html>
  <head>
    <title>CodePost</title>
  </head>
  <body>
    <a href="/login">Sign in with GitHub</a>
  </body>
</html>`.trim()

module.exports = (req, res) => { res.end(message) }
```

After this, I run `now` to deploy it:

<img alt="now output screenshot" src="https://cldup.com/Wq1xVauSpo.png" width="428" height="200">

...and go to the URL to check that it works:

<img alt="now output screenshot" src="https://cldup.com/57OXbYgUz0.png" width="278" height="99">

By the way, each time I complete a step, I'm running `now` and committing to this repo, so if you'd like to follow along, go to the first commit. You'll see that the README ends abruptly here 😁

## Creating an OAuth2 Application and adding the secrets

In order to do OAuth a client key and a client secret are needed. These can be obtained by registering an OAuth application in GitHub. Go to GitHub's Settings, choose OAuth applications from the left sidebar, and click the *Register a new application* button.

Enter an application name, a homepage URL, and the callback URL. The callback URL I'm using is at codepost.now.sh. I'll use [now alias][now-alias] after the next deploy to make the `codepost` use the next deployment.

<img alt="register oauth application screenshot" src="https://cldup.com/t62HjZfUSd.png" width="483" height="390">

After submitting the form, the client ID and secrets are shown:

<img alt="oauth application details screenshot" src="https://cldup.com/k4A11QYPDv.png" width="585" height="387">

*Now* has a namespace for secrets and a namespace for environment variables. The secrets are encrypted and made available to the apps by including them in environment variables. Other than that, they can't be shown once they're added.

To [set a secret][now-secrets], use `now secret add <key> <value>`.

```
➜  github-oauth-from-scratch git:(master) now secret add github-client-id f62a0131d3b7458faacf
> Success! Secret github-client-id (sec_zKdXBLQ3zNhSU3J584AM8pxa) added [2s]
➜  github-oauth-from-scratch git:(master) now secret add github-client-secret 97daba1f4161c124d8571016b03142ab9eb8c401
> Success! Secret github-client-secret (sec_Hvvp531v7m1j5Tgs4bwK4m5h) added [1s]
```

(I regenerated the secret after taking this screenshot and copying this output, and ran `now secret rm` and `now secret add` to update it on *now*.)

To use these, I'll run `now` with `-e` to specify environment variables, and `@` to reference secrets:

```
➜  github-oauth-from-scratch git:(master) ✗ now -e GITHUB_CLIENT_ID=@github-client-id -e GITHUB_CLIENT_SECRET=@github-client-secret

> Deploying ~/projects/github-oauth-from-scratch
> Using Node.js 7.7.3 (default)
> Ready! https://github-oauth-from-scratch-pffvuoskeu.now.sh (copied to clipboard) [2s]
> You are on the OSS plan. Your code will be made public.
> Upload [====================] 100% 0.0s
> Sync complete (5.15kB) [5s]
> Initializing…
> Building
> ▲ npm install
> ⧗ Installing:
>  ‣ micro@^7.3.2
> ✓ Installed 100 modules [4s]
> ▲ npm start
> > github-oauth-from-scratch@1.0.0 start /home/nowuser/src
> > micro
> Deployment complete!
```

This deploys successfully. I'll grab the URL and create an alias so it will be on `https://codepost.now.sh/` so it can use the callback URL in the OAuth Application registration in GitHub:

```
➜  github-oauth-from-scratch git:(master) ✗ now alias https://github-oauth-from-scratch-pffvuoskeu.now.sh codepost
> Success! Alias created (8WEmvOADirbmt4SRndYeO4L6):
https://codepost.now.sh now points to https://github-oauth-from-scratch-pffvuoskeu.now.sh (AqyB9Dodxa287m0RlVJbufMa) [copied to clipboard]
```

I can go and look at the page. Since the code hasn't changed, it's the same as it was in the previous step:

<img alt="codepost.now.sh screenshot" src="https://cldup.com/tXHm1JXqKH.png" width="174" height="39">

## Redirecting to GitHub for authentication

The first step in the [Web Application Flow][github-web-application-flow] is redirecting to GitHub so the user can sign into the application with their GitHub account, using OAuth, and give the application permissions requested through the `scope` field.

The query parameters are:

- `client_id`: This will be in `process.env.GITHUB_CLIENT_ID` when the app is deployed with the `now` command from the previous step.
- `redirect_uri`: The URL to which to redirect. In the details it says that the `redirect_uri` parameter is optional and that it must exactly match the callback URL specified in the OAuth app registration. I think it's reasonable to omit it, though including it could guard against someone with access to the GitHub account changing the `redirect_uri`, so if you're worried about that happening, it would be worth including it.
- `scope`: In many GitHub apps, this is just left blank, as being able to sign in with GitHub is useful in itself. For this example I've chosen to use to use the GitHub API to incentivize myself to make sure it's secure. I'll set this to `gist` and have the app post a gist.
- `state`: This can be any value, and it will be passed back in the callback URL when GitHub hands control back to the app. It's used to verify that the authenticated user is the same user who initiated the login.
- `allow_signup`: Defaults to `true`.

The `state` requires some thought. The reason it's necessary is because if the it isn't verified that the user initiating the redirect and the user receiving the callback are the same, this scenario can happen:

- malicious client X logs in using an account they control, and traps and captures the callback URL, by blocking connection with the OAuth client app server when redirecting (using `/etc/hosts`), and getting the URL from the developer tools in their browser (preserving the log in the network request tab)
- malicious client X gets user Y to visit the callback URL, perhaps by sending it in an email, with the link hidden
- user Y is logged into the account controlled by user X, because without state parameter checking, the callback has all that's needed for the user to be logged in
- user Y submits private data before realizing they're in the wrong account
- since user X controls the account user Y is logged into, user X can get the data that user Y unwittingly submitted to the wrong account

Not all sites store private data that's submitted by the user, but there are other possibilities, and it's better to protect against this up front.

A common way of doing this is using the session. I want to do this without having a session, to see how close to a stateless JSON API I can make it, and to use LocalStorage instead of cookies, since cookies are sent with every request and this only needs to be sent with some requests.

One approach would be to pass a token generated using the HTML5 crypto API to the `/login` URL, and use that as the `state` parameter in a redirect, and then have the client check it. This would handle the above scenario, so long as the client code wasn't modified to remove the check.

However, a callback URL and modified client code alone would be enough to be logged in, and this isn't ideal. It would be almost the same as a login link. A properly sent redirect URL and the callback should both be required.

To do this without dynamically storing data on the server side, the token sent to the login URL could be encrypted (two-way) or signed (one-way) using a static secret key on the server, and the encrypted token could be passed as the state parameter. After the callback, the server could send the encrypted state to the client, and the client could send both the original token that it saved in LocalStorage and the encrypted token to the server, and the server could check that the original token and the encrypted state token match, by decrypting the encrypted state token using the static secret, and seeing that it matches the original token.

Now, the client will need to hold on to the actual OAuth2 token obtained by the server. The client should only be given an encrypted OAuth2 token, so the server will have to decrypt it in order for it to be used. The client having the token has the advantage of the client being able to make requests directly to GitHub, and this technique is often used in mobile apps, but it has the drawback that the user can make arbitrary requests and have them associated with the client application. A malicious client could use it for scraping, and it could get the token revoked by the OAuth2 provider, and it would be a hassle. So if the token only needs to be used by the server, it should only be allowed to be used by the server.

For simplicity, I'll use two-way encryption both for the state parameter and the secret. Two-way encryption is needed for the OAuth2 token, because it needs to be stored encrypted on the client, and decrypted to be used on the server, to prevent tampering. One-way encryption would be more ideal for the state parameter checking, but I feel that two-way encryption is adequate for this use case, so I'll use two-way encryption for both purposes, so an additional function isn't needed.

I've created some basic encryption functions in a new file, `simple-encryption.js`. These are fairly weak, but are just for defending from XSS and preventing tampering with OAuth2 tokens for a user:

``` javascript
const crypto = require('crypto')

module.exports = (secret) => {
  if (secret.length < 32) {
    throw new Error('encryption key must be at least 32 characters')
  }

  return {
    encrypt: (value) => {
      const cipher = crypto.createCipher('aes192', secret)
      let encrypted = cipher.update(value, 'utf8', 'hex')
      return encrypted + cipher.final('hex')
    },
      decrypt: (value) => {
      const decipher = crypto.createDecipher('aes192', secret)
      let decrypted = decipher.update(value, 'hex', 'utf8')
      return decrypted += decipher.final('utf8')
    }
  }
}
```

Moving the HTML to a separate file, and giving the login link an ID so its `href` can be changed, and including a client-side JavaScript file to generate the random token and put it in the `href`:

``` html
<!doctype html>
<html>
  <head>
    <title>CodePost</title>
  </head>
  <body>
    <a id="loginLink" href="/login">Sign in with GitHub</a>
    <script src="/client.js" charset="utf-8"></script>
  </body>
</html>
```

The code to generate a token using the [crypto API][mdn-crypto] and put it in the href (only works on new browsers):

``` javascript
(() => {
  let array = new Uint32Array(8)
  window.crypto.getRandomValues(array)
  Array.prototype.slice.call(array)
  let randomHex = Array.from(array).map(n => n.toString(16)).join('')
  getElementById('loginLink').href = '/login?token=' + randomHex
})()
```

For the redirect, a new secret will need to be added to the now configuration:

```
➜  github-oauth-from-scratch git:(master) ✗ node -e "process.stdout.write(require('crypto').randomBytes(16).toString('hex'))"
8693bfe59b708afb557d854651b291f4%
➜  github-oauth-from-scratch git:(master) ✗ now secret add secret-auth-key $(node -e "process.stdout.write(require('crypto').randomBytes(16).toString('hex'))")
> Success! Secret secret-auth-key (sec_7NnUDdAc6gZdyyaAl8iYDFpn) added [365ms]
➜  github-oauth-from-scratch git:(master) ✗
```

An environment variable will need to be added to the `now` command next time it's run:

```
now -e GITHUB_CLIENT_ID=@github-client-id -e GITHUB_CLIENT_SECRET=@github-client-secret -e SECRET_AUTH_KEY=@secret-auth-key
```

Now to tackle `index.js`. To handle `/login`, the URL will need to be parsed to get the query string value, and it will be matched against just the pathname. Then, the query parameters will be set up and stringified, including state, which is obtained by encrypting the `token` from the query string parameter. Finally, it will redirect using the `302` status code and the `Location` header:

``` javascript
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
```

It's time to  deploy with `now`. In order to not have to type the environment variables
each time, I'll add a command to run `now` to my `package.json` (other
properties omitted):

``` javascript
{
  "scripts": {
    "start": "micro",
    "test": "echo \"Error: no test specified\" && exit 1",
    "deploy": "now -e GITHUB_CLIENT_ID=@github-client-id -e GITHUB_CLIENT_SECRET=@github-client-secret -e SECRET_AUTH_KEY=@secret-auth-key"
  }
}
```

And I'll run `npm run deploy` and `now alias`:

```
➜  github-oauth-from-scratch git:(master) ✗ npm run deploy

> github-oauth-from-scratch@1.0.0 deploy /Users/bat/projects/github-oauth-from-scratch
> now -e GITHUB_CLIENT_ID=@github-client-id -e GITHUB_CLIENT_SECRET=@github-client-secret -e SECRET_AUTH_KEY=@secret-auth-key

> Deploying ~/projects/github-oauth-from-scratch
> Using Node.js 7.7.3 (default)
> Ready! https://github-oauth-from-scratch-gtopcvdbjr.now.sh (copied to clipboard) [4s]
> You are on the OSS plan. Your code will be made public.
> Upload [====================] 100% 0.0s
> Sync complete (212B) [21s]
> Initializing…
> Building
> ▲ npm install
> ⧗ Installing:
>  ‣ micro@^7.3.2
> ✓ Installed 100 modules [4s]
> ▲ npm start
> > github-oauth-from-scratch@1.0.0 start /home/nowuser/src
> > micro
> Deployment complete!
➜  github-oauth-from-scratch git:(master) ✗ now alias https://github-oauth-from-scratch-gtopcvdbjr.now.sh codepost
> Success! Alias created (JMQEVkwcBzaZg1tpyoxnXap2):
https://codepost.now.sh now points to https://github-oauth-from-scratch-gtopcvdbjr.now.sh (DGjKe93xOXvCxk0CYxwDLpSf) [copied to clipboard]
```

And when I go to `https://codepost.now.sh/` and open up Chrome inspector to check the link, I get this:

<img alt="codepost sign in screenshot" src="https://cldup.com/NYPLnxQaZL.png" width="347" height="249">

You can see in Chrome Inspector that the token starts with `3c7fb8`. When I click it, I get shown the GitHub authorization screen:

<img alt="github sign in screen" src="https://cldup.com/zc0K9Zvmuk.png" width="512" height="289">

The state starts with `eaec09` which is different from the token, as expected. After clicking the *Authorize application* button, it redirects to the callback URL, as shown:

![callback url showing sign in page](https://cldup.com/yKR5ihdLKZ.png)

The first step of the [Web Application Flow][github-web-application-flow] appears to be working. Next is handling the callback, and using the code to obtain an OAuth access token, and handing the encrypted access token to the client.

[now]:https://zeit.co/now
[now-secrets]:https://zeit.co/docs/features/env-and-secrets
[micro]:https://github.com/zeit/micro
[node]:https://nodejs.org/en/docs/
[node-http]:https://nodejs.org/api/http.html
[node-crypto]:https://nodejs.org/dist/latest-v7.x/docs/api/crypto.html
[node-url]:https://nodejs.org/api/url.html
[oauth2]:https://oauth.net/2/
[github-api]:https://developer.github.com/v3/
[github-oauth]:https://developer.github.com/v3/oauth/
[github-gists]:https://developer.github.com/v3/gists/
[mdn]:https://developer.mozilla.org/en-US/
[now-alias]:https://zeit.co/docs/features/aliases#creating-aliases
[github-web-application-flow]:https://developer.github.com/v3/oauth/#web-application-flow
[mdn-crypto]:https://developer.mozilla.org/en-US/docs/Web/API/Window/crypto
