const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

let fileExist = function (file, cb) {
    let currentDir = path.resolve(__dirname)
    let walk = function (filePath) {
        fs.readdir(filePath, (err, files) => {
            if (err) cb(err)
            if (!files.length) return cb(`${file} can't be found in ${filePath}`)

            let filesCount = 0
            let hasDirectory = false

            files.map((filename) => { 
                let dir = path.join(filePath, filename)

                fs.stat(dir, (err, stats) => {
                    if (err) cb(err)

                    if (stats.isFile()) {
                        file === filename ?
                        cb(null, file, dir, filePath) : filesCount++ && filesCount === files.length && !hasDirectory && file !== 'zlib.js' ?
                        cb(`${file} can't be found in ${filePath}`) : null
                    } 
                    else if (stats.isDirectory()) {
                        hasDirectory = true
                        walk(dir)
                    }
                })
            })
        })
    }
    walk(currentDir)
}

if (process.argv.length !== 5) {
    console.error('Invaild format!')
} else {
    let type = process.argv[2].slice(1)
    let file = process.argv[4]

    fileExist(file, (err, file, dir, filePath) => {
        if (err) {
            console.error(err)
        }
        else if (type === 'gzip' && (file.indexOf('.gz') === -1)) {
            fs.createReadStream(dir).pipe(zlib.createGzip()).pipe(fs.createWriteStream(path.join(filePath, `${file}.gz`)))
        } 
        else if (type === 'gunzip' && (file.indexOf('.gz') > -1)) {
            fs.createReadStream(dir).pipe(zlib.createGunzip()).pipe(fs.createWriteStream(path.join(filePath, file.slice(0, file.length - 3))))
        }
        else {
            console.error('Match failed')
        }
    })
}

