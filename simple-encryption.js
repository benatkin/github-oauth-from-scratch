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
