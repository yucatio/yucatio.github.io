const field = {
  _solverStack : [],

  done: false,

  init : (targetPiece) => {
    field._solverStack =[]
    field.done = false

    // create field with 5 * num_katamino. Each cell is initialized to "-1"
    let kataminoField = new Array(5).fill().map(() => (
      new Array(targetPiece.length).fill(-1)
    ))

    const minEmpty = {x:0, y:0}
    const placedPiece = []

    targetPiece.forEach((pieceId) => {
      KATAMINO_ARR[pieceId].forEach((spin, spinId) => {
        field._solverStack.push({pieceId, spinId, spin, kataminoField, minEmpty, unPlacedPiece:　targetPiece, placedPiece})
      })
    })
  },

  solve : (onNewPlace, onSolved, onNotSolved) => {
    if (field._solverStack.length <= 0) {
      // not solved
      console.log("not solved")
      field.done = true
      onNewPlace([])
      onNotSolved()
      return
    }

    const {pieceId, spinId, spin, kataminoField, minEmpty, unPlacedPiece, placedPiece} = field._solverStack.pop()

    // spin.place[0] always x=0, minumum y in x=0
    const offset = {x: minEmpty.x, y: minEmpty.y - spin[0].y}

    if (! field.isAllEmpty(kataminoField, offset, spin)) {
      // out of field or another piece already there
      return
    }

    const nextField = util.copyArrayOfArray(kataminoField)
    field.placeKatamino(nextField, offset, spin, pieceId)

    const nextUnPlaced = unPlacedPiece.concat()
    util.removeFromArray(nextUnPlaced, pieceId)

    const nextPlacedPiece = placedPiece.concat()
    nextPlacedPiece.push({offset, pieceId, spinId, spin})

    onNewPlace(nextPlacedPiece)

    if (nextUnPlaced.length <= 0) {
      console.log("completed")

      field.done = true
      onSolved()
      return
    }

    const nextEmpty = field.findNextEmpty(nextField, minEmpty)

    if (! field.hasFiveTimesCells(nextField, nextEmpty)) {
      // wrongly devided
      return
    }

    nextUnPlaced.forEach((nextPieceId) => {
      KATAMINO_ARR[nextPieceId].forEach((nextSpin, nextSpinId) => {
        field._solverStack.push({pieceId:nextPieceId, spinId:nextSpinId, spin: nextSpin, kataminoField: nextField, minEmpty: nextEmpty, unPlacedPiece: nextUnPlaced, placedPiece: nextPlacedPiece})
      })
    })
  },

  isAllEmpty: (kataminoField, offset, places) => {
    return places.every((place) => (
      field.isEmpty(kataminoField, {x: offset.x + place.x, y: offset.y + place.y})
    ))
  },

  isEmpty: (kataminoField, place) => {
    return (
      kataminoField[place.x] !== undefined &&
      kataminoField[place.x][place.y] !== undefined &&
      kataminoField[place.x][place.y] < 0
    )
  },

  placeKatamino: (kataminoField, offset, places, pieceId) => {
    places.forEach((place) => {
      kataminoField[offset.x + place.x][offset.y + place.y] = pieceId
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
