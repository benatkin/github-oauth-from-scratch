# GitHub OAuth2 from scratch

I'm following the GitHub API docs to implement OAuth2 from scratch, developing it with micro and now.sh.

My plan is to build it without any dependencies, except for the platforms. It's good to work with just the platforms once in a while. The platform docs:

- [now][now]
- [micro][micro]
- [node][node] - [http][node-http], [crypto API][node-crypto]
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

[now]:https://zeit.co/now
[micro]:https://github.com/zeit/micro
[node]:https://nodejs.org/en/docs/
[node-http]:https://nodejs.org/api/http.html
[node-crypto]:https://nodejs.org/dist/latest-v7.x/docs/api/crypto.html
[oauth2]:https://oauth.net/2/
[github-api]:https://developer.github.com/v3/
[github-oauth]:https://developer.github.com/v3/oauth/
[github-gists]:https://developer.github.com/v3/gists/
[mdn]:https://developer.mozilla.org/en-US/
