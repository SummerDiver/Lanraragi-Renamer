const fs = require('fs')
const path = require('path')

const backupFilePath = path.normalize('./backup.json')
const newBackupFilePath = path.normalize(
  'F:/Media/RenamerOutput/backup-new.json'
)
const inputFolderPath = path.normalize('F:/Media/Comics')
const outputFolderPath = path.normalize('F:/Media/RenamerOutput/Comics')

const loadBackupFile = (dir = path.normalize('./backup.json')) => {
  try {
    return JSON.parse(fs.readFileSync(dir, 'utf8'))
  } catch (err) {
    console.error(err)
  }
}

const backupFile = loadBackupFile(backupFilePath)
const { archives } = backupFile
const newBackupFile = loadBackupFile(backupFilePath)
const newArchives = []

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

archives.forEach((archive, index) => {
  const { filename, title } = archive
  const found = fileList.find(({ file }) => path.parse(file).name === filename)

  const parsedTitle = title.replace(/[<>:"\/\\\|?*\x00-\x1F]/g, '-')
  console.log(`【${index + 1}/${totalFiles}】${filename}\n\t---> ${title}`)

  if (!found) {
    console.log(`Not found.`)
  } else {
    const { file, dir } = found
    const oldPath = path.join(dir, file)
    const newDir = dir.replace(inputFolderPath, outputFolderPath)
    const newFile = parsedTitle + path.extname(file)
    const tempPath = path.join(newDir, file)
    const newPath = path.join(newDir, newFile)

    newArchives.push({ ...archive, file: parsedTitle })

    if (!fs.existsSync(oldPath)) {
      return
    }

    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true })
    }

    if (fs.existsSync(newPath)) {
      console.log(`\tAlready exists.`)
      return
    }

    fs.copyFileSync(oldPath, tempPath)
    fs.renameSync(tempPath, newPath)

    console.log(`\tFinished.`)
  }
})

newBackupFile.archives = newArchives
fs.writeFileSync(newBackupFilePath, JSON.stringify(newBackupFile, null, 2))
