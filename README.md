# GitHub OAuth2 from scratch

I'm following the GitHub API docs to implement OAuth2 from scratch, developing it with micro and now.sh.

My plan is to build it without any dependencies, except for the platforms. It's good to work with just the platforms once in a while. The platform docs:

- [now][now] - [secrets][now-secrets]
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

# Creating an OAuth2 Application and adding the secrets

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

[now]:https://zeit.co/now
[now-secrets]:https://zeit.co/docs/features/env-and-secrets
[micro]:https://github.com/zeit/micro
[node]:https://nodejs.org/en/docs/
[node-http]:https://nodejs.org/api/http.html
[node-crypto]:https://nodejs.org/dist/latest-v7.x/docs/api/crypto.html
[oauth2]:https://oauth.net/2/
[github-api]:https://developer.github.com/v3/
[github-oauth]:https://developer.github.com/v3/oauth/
[github-gists]:https://developer.github.com/v3/gists/
[mdn]:https://developer.mozilla.org/en-US/
[now-alias]:https://zeit.co/docs/features/aliases#creating-aliases
[github-web-application-flow]:https://developer.github.com/v3/oauth/#web-application-flow
