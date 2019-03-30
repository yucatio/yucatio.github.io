const action = {
  _solverTimer: null,
  _updateFieldTimer: null,

  init: () => {
    action.newPieceSelection()
  },

  addToTargetPieceList: (pieceId) => {
    if (util.addToUniqArray(state.targetPieceList, pieceId)) {
      action._updateEnableToStart()
      displayManager.targetPieceListUpdated()
    }
  },

  removeFromTargetPieceList: (pieceId) => {
    if (util.removeFromArray(state.targetPieceList, pieceId) >= 0) {
      action._updateEnableToStart()
      displayManager.targetPieceListUpdated()
    }
  },

  startSolve: () => {
    state.solverState = "solving"
    displayManager.solverStateChanged()

    field.init(state.targetPieceList)
    action._startSolverTimer()
    action._startUpdateFieldTimer()
  },

  newPieceSelection: () => {
    state.solverState = "selectPiece"
    state.displayQueue = []
    state.fieldPieceList = []
    state.result = null
    displayManager.solverStateChanged()
  },

  pause: () => {
    state.solverState = "pause"
    displayManager.solverStateChanged()

    action._stopUpdateFieldTimer()

    if (! field.done) {
      action._stopSolverTimer()
    }
  },

  resume: () => {
    state.solverState = "solving"
    displayManager.solverStateChanged()

    action._startUpdateFieldTimer()
    if (! field.done) {
      action._startSolverTimer()
    }
  },

  changeSpeed: (speed) => {
    state.speed = speed

    if (state.solverState === "solving") {
      // stop
      action._stopUpdateFieldTimer()

      if (! field.done) {
        action._stopSolverTimer()
      }

      // start
      action._startUpdateFieldTimer()
      if (! field.done) {
        action._startSolverTimer()
      }
    }
  },

  _startSolverTimer: () => {
    action._solverTimer = setInterval(field.solve, config.speedList[state.speed].solver, action._onNewPlace, action._onSolved, action._onNotSolved)
  },

  _stopSolverTimer: () => {
    clearInterval(action._solverTimer)
  },

  _startUpdateFieldTimer: () => {
    action._updateFieldTimer = setInterval(action._updateFieldDisplay, config.speedList[state.speed].field)
  },

  _stopUpdateFieldTimer: () => {
    clearInterval(action._updateFieldTimer)
  },

  _onNewPlace: (placedPiece) => {
    if (state.displayQueue.length <= 0) {
      state.displayQueue.push({placedPiece})
      return
    }

    const lastPlacedPiece = state.displayQueue[state.displayQueue.length -1].placedPiece

    if (lastPlacedPiece.length !== placedPiece.length) {
      // if newPlace or placedPlace is changed, add to displayQueue

      if (state.displayQueue.length >= 2) {
        const last2PlacedPiece = state.displayQueue[state.displayQueue.length -2].placedPiece
        // if for the case
        // Example: queue=[{1, 2, 3}, {1,2}], placedPiece={1,2,3}
        // New queue= [{1,2,3}, {1,2,3}]
        if ((lastPlacedPiece.length === placedPiece.length -1)
              && (last2PlacedPiece.length === placedPiece.length)
              && (last2PlacedPiece[last2PlacedPiece.length -1].spin.pieceId === placedPiece[placedPiece.length -1].spin.pieceId)) {
          state.displayQueue.pop()
        }
      }

      state.displayQueue.push({placedPiece})

      return
    }
  },

  _onSolved: (placedPiece) => {
    state.displayQueue.push({placedPiece, result: "solved"})
    action._stopSolverTimer()
  },

  _onNotSolved: () => {
    state.displayQueue.push({placedPiece:[], result: "notSolved"})
    action._stopSolverTimer()
  },

  _updateFieldDisplay: () => {
    const placed = state.displayQueue.shift()

    if (! placed) {
      return
    }

    state.fieldPieceList = placed.placedPiece
    displayManager.fieldPieceUpdated()

    if (placed.result) {
      state.result = placed.result
      action._stopUpdateFieldTimer()

      state.solverState = "solveEnd"
      displayManager.solverStateChanged()
    }
  },

  _updateEnableToStart: () => {
    state.enableToStart = (state.targetPieceList.length >= 3)
  },
}
