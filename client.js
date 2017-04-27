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

function init() {
  let authorization = localStorage.getItem('authorization') || ''
  const cookieValue = getCookie('oauthResponse')

  if (authorization.indexOf(';') === -1) {
    if (cookieValue) {
      authorization = `${authorization};${cookieValue}`
      localStorage.setItem('authorization', authorization)
    }
  }
  
  const containerEl = document.getElementById('container')
  containerEl.classList.remove('state-login', 'state-post')
  if (authorization.indexOf(';') === -1) {
    containerEl.classList.add('state-login')
    authorization = randomHex()
    localStorage.setItem('authorization', authorization)
    document.getElementById('loginLink').href = '/login?token=' + authorization
  } else {
    containerEl.classList.add('state-post')
  }
}

init()
