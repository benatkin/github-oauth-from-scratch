(() => {
  let array = new Uint32Array(8)
  window.crypto.getRandomValues(array)
  Array.prototype.slice.call(array)
  let randomHex = Array.from(array).map(n => n.toString(16)).join('')
  document.getElementById('loginLink').href = '/login?token=' + randomHex
})();
