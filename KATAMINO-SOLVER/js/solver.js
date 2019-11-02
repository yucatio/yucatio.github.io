const solver = {
  solverStack : [],
  timer: null,
  speed: config.speedList[config.defaultSpeedLevel],

  init : (targetPieces) => {
    const kataminoField = new Array(5).fill().map(() => (
      new Array(targetPieces.length).fill(-1)
    ))

    solver.solverStack  = []
    timer = null

    const minEmpty = {x:0, y:0}
    const placedPieces = []
    targetPieces.forEach((pieceId) => {
      solver.solverStack.push({kataminoField, minEmpty, pieceId, spinId:null, spin:null, unPlacedPieces: targetPieces, placedPieces})
      KATAMINO_ARR[pieceId].forEach((spin, spinId) => {
        solver.solverStack.push({kataminoField, minEmpty, pieceId, spinId, spin, unPlacedPieces: targetPieces, placedPieces})
      })
    })
  },

  solve : (options) => {
    const {onUpdatePieces = (placedPieces)=>{}, onSolved = ()=>{}, onNotSolved = ()=>{}} = options

    if (solver.solverStack.length <= 0) {
      // Not solved
      onNotSolved()
      return
    }

    const {kataminoField, minEmpty, pieceId, spinId, spin, unPlacedPieces, placedPieces} = solver.solverStack.pop()

    if (! spin) {
      const timeout = state.placedPieces.length === placedPieces.length ? 0 : solver.speed
      onUpdatePieces(placedPieces)
      solver.timer = setTimeout(() => solver.solve(options), timeout)
      return
    }

    // spin[0] always x=0
    const offset = {x: minEmpty.x, y: minEmpty.y - spin[0].y}

    if (! solver.isAllEmpty(kataminoField, spin, offset)) {
      // Out of field or another piece already there
      solver.timer = setTimeout(() => solver.solve(options), 0)
      return
    }

    const nextField = util.copyArrayOfArray(kataminoField)
    solver.placeSpin(nextField, spin, offset, pieceId)

    const nextUnPlaced = unPlacedPieces.filter(id => id !== pieceId)

    const nextPlacedPieces = [...placedPieces, {pieceId, spinId, offset}]

    onUpdatePieces(nextPlacedPieces)

    if (nextUnPlaced.length <= 0) {
      onSolved()
      return
    }

    const nextEmpty = solver.findNextEmpty(nextField, minEmpty)

    if (! solver.hasAllFiveTimesCells(nextField, nextEmpty)){
      solver.timer = setTimeout(() => solver.solve(options), solver.speed)
      return
    }

    nextUnPlaced.forEach((nextPieceId) => {
      solver.solverStack.push({kataminoField: nextField, minEmpty: nextEmpty, pieceId:nextPieceId, spinId:null, spin: null, unPlacedPieces: nextUnPlaced, placedPieces: nextPlacedPieces})
      KATAMINO_ARR[nextPieceId].forEach((nextSpin, nextSpinId) => {
        solver.solverStack.push({kataminoField: nextField, minEmpty: nextEmpty, pieceId:nextPieceId, spinId:nextSpinId, spin: nextSpin, unPlacedPieces: nextUnPlaced, placedPieces: nextPlacedPieces})
      })
    })

    solver.timer = setTimeout(() => solver.solve(options), solver.speed)
  },

  stop: () => {
    clearTimeout(solver.timer)
  },

  isAllEmpty: (kataminoField, places, offset) => {
    return places.every((place) => (
      solver.isEmpty(kataminoField, {x: place.x + offset.x, y: place.y + offset.y})
    ))
  },

  isEmpty: (kataminoField, place) => {
    return (
      kataminoField[place.x] !== undefined &&
      kataminoField[place.x][place.y] !== undefined &&
      kataminoField[place.x][place.y] < 0
    )
  },

  placeSpin: (kataminoField, places, offset, pieceId) => {
    places.forEach((place) => {
      kataminoField[place.x + offset.x][place.y + offset.y] = pieceId
    })
  },

  findNextEmpty : (kataminoField, previousEmpty) => {
    const minEmptyX = kataminoField.slice(previousEmpty.x).findIndex(row =>
      row.some((val) => val < 0)
    )
    if (minEmptyX < 0) {
      // No empty cells found
      return undefined
    }
    const x = previousEmpty.x + minEmptyX

    const y = kataminoField[x].findIndex(val => val < 0)

    return {x, y}
  },

  /**
   * Returns all empty cell cluster has 5-time cells
   */
   hasAllFiveTimesCells: (kataminoField, minEmpty) => {
     const kataminoFieldCopy = util.copyArrayOfArray(kataminoField)
     let nextEmpty = minEmpty

     while (nextEmpty) {
       if (! solver.hasFiveTimesCells(kataminoFieldCopy, nextEmpty)) {
         return false
       }
       nextEmpty = solver.findNextEmpty(kataminoFieldCopy, nextEmpty)
     }
     return true
   },

  /**
   * Returns the empty cell cluster including emptyCluster has 5-times cells
   */
   hasFiveTimesCells: (kataminoField, emptyPlace) => {
     const queue = [emptyPlace]
     let count = 0

     while (queue.length > 0) {
       const currentPlace = queue.shift()

       if (! solver.isEmpty(kataminoField, currentPlace)) {
         continue
       }

       count++
       kataminoField[currentPlace.x][currentPlace.y] = 100

       queue.push({x:currentPlace.x + 1, y: currentPlace.y})
       queue.push({x:currentPlace.x, y: currentPlace.y + 1})
       queue.push({x:currentPlace.x - 1, y: currentPlace.y})
       queue.push({x:currentPlace.x, y: currentPlace.y - 1})
     }

     return count%5 === 0
   },

   setSpeed: (speed) => {
     solver.speed = speed
   },
}
