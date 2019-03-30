const field = {
  _solverStack : [],

  done: false,

  init : (targetPiece) => {
    field._solverStack =[]
    field.done = false

    let kataminoField = []
    // create field with 5 * num_katamino. Each cell is initialized to "-1"
    for(let i=0; i < 5; i++) {
      kataminoField.push((new Array(targetPiece.length)).fill(-1))
    }

    const minEmpty = {x:0, y:0}
    const placedPiece = []

    targetPiece.forEach((piece) => {
      KATAMINO_ARR[piece].forEach((spin) => {
        field._solverStack.push({spin, kataminoField, minEmpty, unPlacedPiece:　targetPiece, placedPiece})
      })
    })

  },

  solve : (onNewPlace, onSolved, onNotSolved) => {
    if (field._solverStack.length <= 0) {
      // not solved
      console.log("not solved")
      field.done = true
      onNotSolved()
      return
    }

    const stackInfo = field._solverStack.pop()

    const spin = stackInfo.spin
    const kataminoField = stackInfo.kataminoField
    const minEmpty = stackInfo.minEmpty
    const unPlacedPiece = stackInfo.unPlacedPiece
    const placedPiece = stackInfo.placedPiece

    // console.log("spin", spin)

    onNewPlace(placedPiece)

    // spin.place[0] always x=0, minumum y in x=0
    const offset = {x: minEmpty.x, y: minEmpty.y - spin.place[0].y}

    if (! field.isAllEmpty(kataminoField, offset, spin.place)) {
      // another piece already there
      return
    }

    const nextField = util.copyArrayOfArray(kataminoField)
    field.placeKatamino(nextField, offset, spin.place, spin.pieceId)
    // console.log("nextField", nextField)

    const nextUnPlaced = unPlacedPiece.concat()
    util.removeFromArray(nextUnPlaced, spin.pieceId)

    const nextPlacedPiece = placedPiece.concat()
    nextPlacedPiece.push({offset, spin})

    if (nextUnPlaced.length <= 0) {
      console.log("completed")

      field.done = true
      onSolved(nextPlacedPiece)
      return
    }
    const nextEmpty = field.findNextEmpty(nextField, minEmpty)

    if (! field.hasFiveTimesCells(nextField, nextEmpty)) {
      // wrongly devided

      onNewPlace(nextPlacedPiece)
      return
    }

    nextUnPlaced.forEach((nextPiece) => {
      KATAMINO_ARR[nextPiece].forEach((nextSpin) => {
        field._solverStack.push({spin: nextSpin, kataminoField: nextField, minEmpty: nextEmpty, unPlacedPiece: nextUnPlaced, placedPiece: nextPlacedPiece})
      })
    })
  },

  isAllEmpty: (kataminoField, offset, placeList) => {
    return placeList.every((place) => (
      field.isEmpty(kataminoField, {x: offset.x + place.x, y: offset.y + place.y})
    ))
  },

  isEmpty: (kataminoField, place) => {
    if (place.x < 0 || place.x >= kataminoField.length) {
      return false
    }
    if (place.y < 0 || place.y >= kataminoField[0].length) {
      return false
    }

    return kataminoField[place.x][place.y] < 0
  },

  placeKatamino: (kataminoField, offset, placeList, pieceId) => {
    placeList.forEach((place) => {
      const x = offset.x + place.x
      const y = offset.y + place.y
      kataminoField[x][y] = pieceId
    })
  },

  findNextEmpty: (kataminoField, previousEmpty) => {
    let nextEmpty = Object.assign({}, previousEmpty)

    const fieldXLength = kataminoField.length
    const fieldYLength = kataminoField[0].length

    while (nextEmpty.x < fieldXLength) {
      while (nextEmpty.y < fieldYLength) {
        if (field.isEmpty(kataminoField, nextEmpty)) {
          return nextEmpty
        }
        nextEmpty.y++
      }
      nextEmpty.y = 0
      nextEmpty.x++
    }
    return null
  },

  hasFiveTimesCells: (kataminoField, place) => {
    const kataminoFieldCopy = util.copyArrayOfArray(kataminoField)
    let nextEmpty = Object.assign({}, place)

    while (nextEmpty) {
      if (! field.hasFiveTimesCellsMain(kataminoFieldCopy, nextEmpty)) {
        return false
      }
      nextEmpty = field.findNextEmpty(kataminoFieldCopy, nextEmpty)
    }

    return true
  },

  hasFiveTimesCellsMain: (kataminoField, place) => {
    const queue = [place]
    let count = 0

    while (queue.length > 0) {
      const currentPlace = queue.shift()

      if (! field.isEmpty(kataminoField, currentPlace)) {
        continue
      }
      // isEmpty
      count++
      kataminoField[currentPlace.x][currentPlace.y] = 100

      queue.push({x:currentPlace.x + 1, y: currentPlace.y})
      queue.push({x:currentPlace.x, y: currentPlace.y + 1})
      queue.push({x:currentPlace.x - 1, y: currentPlace.y})
      queue.push({x:currentPlace.x, y: currentPlace.y - 1})
    }

    return count%5 === 0
  },
}
