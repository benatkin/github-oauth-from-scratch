function getCookie(name) {
  // from https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
  const cookieRegex = new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*\\=\\s*([^;]*).*$)|^.*$`)
  const result = document.cookie.replace(cookieRegex, '$1')
  return typeof result == 'string' && result.length ? decodeURIComponent(result) : null
}

function randomHex() {
  let array = new Uint32Array(8)
  window.crypto.getRandomValues(array)
  Array.prototype.slice.call(array)
  return Array.from(array).map(n => n.toString(16)).join('')
}

function setContainerClass(className) {
  const containerEl = document.getElementById('container')
  containerEl.classList.remove('state-login', 'state-post', 'state-error', 'state-success')
  containerEl.classList.add(className)
}

function setError(message) {
  const errorEl = document.getElementById('error')
  errorEl.innerText = message
  setContainerClass('state-error')
}

function init() {
  let authorization = localStorage.getItem('authorization') || ''
  const cookieValue = getCookie('oauthResponse')

  if (authorization.length && authorization.indexOf(';') === -1) {
    if (cookieValue) {
      authorization = `${authorization};${cookieValue}`
      localStorage.setItem('authorization', authorization)
    }
  }
  
  const containerEl = document.getElementById('container')
  if (authorization.indexOf(';') === -1) {
    setContainerClass('state-login')
    authorization = randomHex()
    localStorage.setItem('authorization', authorization)
    document.getElementById('loginLink').href = '/login?token=' + authorization
  } else {
    setContainerClass('state-post')
    const buttonEl = document.getElementById('createGist')
    const messageEl = document.getElementById('message')
    buttonEl.addEventListener('click', e => {
      fetch('/gists', {
        method: 'POST',
        headers: new Headers({
          authorization: authorization,
          accept: 'application/json',
          'content-type': 'application/json'
        }),
        body: JSON.stringify({message: messageEl.value})
      }).then(response => {
        if (!response.ok) throw new Error('error from server')
        return response.json()
      }).then(body => {
        const gistLinkEl = document.getElementById('gistLink')
        gistLinkEl.href = body.url
        setContainerClass('state-success')
      }).catch(err => {
        setError('Error creating gist')
      })
    })
  }
}

init()
