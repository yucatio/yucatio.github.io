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
    // insert stepback piece
    while(true) {
      const previousPlaced = state.displayQueue.length > 0 ?
                               state.displayQueue[state.displayQueue.length - 1].placedPiece :
                               state.fieldPieceList
      if (previousPlaced.length < placedPiece.length) {
        break
      }
      if(placedPiece.length <= 0 && previousPlaced.length === 1) {
        break
      }
      if (previousPlaced.length === placedPiece.length &&
          previousPlaced[previousPlaced.length - 1].pieceId === placedPiece[previousPlaced.length - 1].pieceId) {
        break
      }
      const stepback = previousPlaced.concat()
      stepback.pop()
      state.displayQueue.push({placedPiece:stepback})
    }

    state.displayQueue.push({placedPiece})
  },

  _onSolved: () => {
    state.displayQueue.push({result: "solved"})
    action._stopSolverTimer()
  },

  _onNotSolved: () => {
    state.displayQueue.push({result: "notSolved"})
    action._stopSolverTimer()
  },

  _updateFieldDisplay: () => {
    const placed = state.displayQueue.shift()

    if (! placed) {
      return
    }

    if (placed.placedPiece) {
      state.fieldPieceList = placed.placedPiece
      displayManager.fieldPieceUpdated()
    }

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
