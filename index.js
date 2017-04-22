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
