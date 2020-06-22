var binpacking = require('binpacking')

var algorithms = {
  'binpacking': binpackingStrict,
  'growing-binpacking': growingBinpacking,
  'horizontal': horizontal,
  'vertical': vertical,
  'file-index': fileIndex
}
exports.pack = function (algorithm, files, options) {
  // algorithm = algorithm || 'growing-binpacking';
  algorithm = algorithm || 'file-index'
  console.log('algorithm', algorithm)
  algorithms[algorithm](files, options)

  if (options.validate) {
    validate(files, options)
  }
}

function fileIndex (files, options) {
  files = files
    .filter(file => /\d+/.exec(file.name))
    .sort((a, b) => {
      const aIndex = /\d+/.exec(a.name)[0]
      const bIndex = /\d+/.exec(b.name)[0]
      return aIndex - bIndex
    })
    // column 和 row 从0开始计数，
    // whichColumn 和 whichRow 从1开始计数。
  const column = Math.floor(Math.sqrt(files.length))
  console.log('column', column)
  const row = Math.ceil(Math.sqrt(files.length))
  files.forEach((file, index) => {  
    const whichColumn = index % column
    const whichRow = Math.floor(index / column)
    file.x = whichColumn * file.width
    file.y = whichRow * file.height
  })
  options.width = files[0].w * column
  options.height = files[0].w * row
}

function validate (files, options) {
  files.forEach(function (item) {
    if (item.x + item.width > options.width || item.y + item.height > options.height) {
      throw new Error("Can't fit all textures in given spritesheet size")
    }
  })

  var intersects = function (x_1, y_1, width_1, height_1, x_2, y_2, width_2, height_2) {
    return !(x_1 >= x_2 + width_2 || x_1 + width_1 <= x_2 || y_1 >= y_2 + height_2 || y_1 + height_1 <= y_2)
  }

  files.forEach(function (a) {
    files.forEach(function (b) {
      if (a !== b && intersects(a.x, a.y, a.width, a.height, b.x, b.y, b.width, b.height)) {
        console.log(a, b)
        throw new Error("Can't fit all textures in given spritesheet size")
      }
    })
  })
}

function growingBinpacking (files, options) {
  var packer = new binpacking.GrowingPacker()
  packer.fit(files)

  files.forEach(function (item) {
    item.x = item.fit.x
    item.y = item.fit.y
    delete item.fit
    delete item.w
    delete item.h
  })

  options.width = packer.root.w
  options.height = packer.root.h
}


function binpackingStrict (files, options) {
  var packer = new binpacking.Packer(options.width, options.height)
  packer.fit(files)

  files.forEach(function (item) {
    item.x = item.fit ? item.fit.x : 0
    item.y = item.fit ? item.fit.y : 0
    delete item.fit
    delete item.w
    delete item.h
  })

  options.width = packer.root.w
  options.height = packer.root.h
}

function vertical (files, options) {
  var y = 0
  var maxWidth = 0
  files.forEach(function (item) {
    item.x = 0
    item.y = y
    maxWidth = Math.max(maxWidth, item.width)
    y += item.height
  })

  options.width = maxWidth
  options.height = y
}

function horizontal (files, options) {
  var x = 0
  var maxHeight = 0
  files.forEach(function (item) {
    item.x = x
    item.y = 0
    maxHeight = Math.max(maxHeight, item.height)
    x += item.width
  })

  options.width = x
  options.height = maxHeight
}