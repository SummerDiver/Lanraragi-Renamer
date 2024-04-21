const fs = require('fs')
const path = require('path')

const { updateMeta } = require('./updateMeta')

const backupFilePath = path.normalize('F:/Media/Comics/backup.json')
const newBackupFilePath = path.normalize(
  'F:/Media/RenamerOutput/backup-new.json'
)
const inputFolderPath = path.normalize('F:/Media/Comics')
const outputFolderPath = path.normalize('F:/Media/RenamerOutput/Comics')

const loadBackupFile = (dir = backupFilePath) => {
  try {
    return JSON.parse(fs.readFileSync(dir, 'utf8'))
  } catch (err) {
    console.error(err)
  }
}

const backupFile = loadBackupFile(backupFilePath)
const { archives } = backupFile

/* // Test Only
let archives = backupFile.archives.filter(
  (archive) =>
    archive.filename ===
    '(C91) [夢茶会 (むちゃ)] 千鶴ちゃん開発日記4 [中国翻訳]'
) */

const newBackupFile = loadBackupFile(backupFilePath)

console.log(archives?.length)

const fileList = []
const traverseDir = (dir = path.normalize('.')) => {
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    if (path.extname(file) === '.json') return
    const filePath = path.join(dir, file)
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      traverseDir(filePath)
    } else {
      fileList.push({ file, dir })
    }
  })
}
traverseDir(inputFolderPath)
const totalFiles = fileList.length

async function process() {
  const newArchives = []

  let count = 0
  for (let archive of archives) {
    const { filename, title } = archive
    const found = fileList.find(
      ({ file }) => path.parse(file).name === filename
    )

    const parsedTitle = title.replace(/[<>:"\/\\\|?*\x00-\x1F]/g, '-')
    console.log(`【${++count}/${totalFiles}】${filename}\n\t---> ${title}`)

    if (!found) {
      newArchives.push({ ...archive })
      console.warn(`Not found.`)
    } else {
      const { file, dir } = found

      const oldPath = path.join(dir, file)
      const newDir = dir.replace(inputFolderPath, outputFolderPath)
      const newFile = parsedTitle + path.extname(file)
      const newPath = path.join(newDir, newFile)

      if (!fs.existsSync(oldPath)) {
        continue
      }

      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true })
      }

      if (fs.existsSync(newPath)) {
        newArchives.push({ ...archive })
        console.log(`\tAlready exists.`)
        continue
      }

      const updatedArchive = await updateMeta(archive, oldPath, newPath)

      newArchives.push({ ...updatedArchive, file: parsedTitle })

      console.log(`\tFinished.`)
    }
  }

  newBackupFile.archives = newArchives
  fs.writeFileSync(newBackupFilePath, JSON.stringify(newBackupFile, null, 2))
}
process()
