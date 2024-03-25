const fs = require('fs')
const crypto = require('crypto')

const computeArchiveId = (archivePath) => {
  const sha1 = crypto.createHash('sha1')

  const fd = fs.openSync(archivePath, 'r')
  const bufferSize = 512000
  const buffer = Buffer.alloc(bufferSize)
  const bytesRead = fs.readSync(fd, buffer, 0, bufferSize, 0)
  fs.closeSync(fd)

  sha1.update(buffer.slice(0, bytesRead))

  return sha1.digest('hex')
}

/* // Test Only
let test = computeArchiveId(
  'F:/Media/RenamerOutput/Comics/千鶴ちゃん開発日記/(C91) [夢茶会 (むちゃ)] 千鶴ちゃん開発日記4 [中国翻訳].zip'
)
console.log(test) */

module.exports = {
  computeArchiveId
}
