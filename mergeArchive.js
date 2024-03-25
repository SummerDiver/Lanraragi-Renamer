const fs = require('fs')
const path = require('path')

const loadBackupFile = (dir = path.normalize('./backup.json')) => {
  try {
    return JSON.parse(fs.readFileSync(dir, 'utf8'))
  } catch (err) {
    console.error(err)
  }
}

const mergeArchive = (
  fromData,
  toData,
  key = 'arcid',
  compareKey = 'filename'
) => {
  const fromArchives = fromData.archives
  const toArchives = toData.archives

  /* 
  ({
    ...archive,
    [key]: fromArchives.find(
      (fArchive) => fArchive.filename === archive.filename
    )[key]
  })
  */
  const mergedArchives = toArchives.map((archive) => {
    const foundArchive = fromArchives.find(
      (fArchive) => fArchive[compareKey] === archive[compareKey]
    )

    const mergedArchive = { ...archive }
    if (foundArchive) {
      mergedArchive[key] = foundArchive[key]
    }

    return mergedArchive
  })

  return {
    ...fromData,
    archives: mergedArchives
  }
}

const fromDataPath = path.normalize('F:/Media/RenamerOutput/backup.json')
const toDataPath = path.normalize('F:/Media/RenamerOutput/backup_old.json')
const savePath = path.normalize('F:/Media/RenamerOutput/backup_merged.json')

const fromData = loadBackupFile(fromDataPath)
const toData = loadBackupFile(toDataPath)

const saveData = mergeArchive(fromData, toData)

fs.writeFileSync(savePath, JSON.stringify(saveData, null, 2))
