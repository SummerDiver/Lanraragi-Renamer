const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')
const archiver = require('archiver')
const unzipper = require('unzipper')
const { computeArchiveId } = require('./computeArchiveId')

module.exports = {
  updateMeta: async (archiveInfo, archivePath, outputPath) => {
    const tagsObj = {
      artist: new Set(),
      source: new Set()
    }
    archiveInfo.tags.split(',').forEach((tag) => {
      const [key, value] = tag.split(':')
      if (tagsObj.hasOwnProperty(key)) {
        tagsObj[key].add(value)
      }
    })

    // const exceptTags = ['artist', 'source', 'date_added']
    const exceptTags = ['source', 'date_added']
    parsedTags = archiveInfo.tags
      .split(',')
      .filter((tag) => !exceptTags.includes(tag.split(':')[0]))
      .join(',')

    const xmlData = {
      ComicInfo: {
        Writer: [...tagsObj.artist.values()].join(',') || 'unknown',
        Web: [...tagsObj.source.values()].join(',') || null,
        Title: archiveInfo.title,
        Tags: parsedTags
      }
    }
    const builder = new xml2js.Builder()
    const xmlObj = builder.buildObject(xmlData)

    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', {
      zlib: { level: 0 } // No compression
    })
    archive.pipe(output)
    archive.append(Buffer.from(xmlObj), { name: 'ComicInfo.xml' })

    const unzipStream = fs
      .createReadStream(archivePath)
      .pipe(unzipper.Parse({ forceStream: true }))
    for await (const entry of unzipStream) {
      const fileName = path.basename(entry.path)
      const type = entry.type // 'Directory' or 'File'
      if (fileName !== 'ComicInfo.xml' && type !== 'Directory') {
        archive.append(entry, { name: fileName })
      } else {
        entry.autodrain()
      }
    }
    await new Promise((resolve, reject) => {
      output.on('close', () => resolve())
      archive.on('error', (err) => reject(err))
      archive.finalize()
    })

    return { ...archiveInfo, arcid: computeArchiveId(outputPath) }
  }
}
