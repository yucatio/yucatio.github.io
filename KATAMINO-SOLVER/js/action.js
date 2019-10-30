const action = {
  addToTargetPieces: (pieceId) => {
    if (state.targetPieces.indexOf(pieceId) < 0) {
      stateManager.setTargetPieces([...state.targetPieces, pieceId])
    }
  },

  removeFromTargetPieces: (pieceId) => {
    if (state.targetPieces.indexOf(pieceId) >= 0) {
      const newPieces = state.targetPieces.filter(id => id !== pieceId)
      stateManager.setTargetPieces(newPieces)
    }
  },

  startSolve: () => {
    solver.init(state.targetPieces)

    action.solve()

    stateManager.setSolverState("solving")
  },

  newPieceSelection: () => {
    stateManager.setPlacedPieces([])
    stateManager.setSolverState("selectPiece")
  },

  pause: () => {
    solver.stop()
    stateManager.setSolverState("pause")
  },

  resume: () => {
    action.solve()
    stateManager.setSolverState("solving")
  },

  changeSpeed: (speedLevel) => {
    solver.setSpeed(config.speedList[speedLevel])
  },

  solve: () => {
    solver.solve({
      onUpdatePieces: (placedPieces) => stateManager.setPlacedPieces(placedPieces),
      onSolved: () => stateManager.setSolverState("solvedSuccess"),
      onNotSolved: () => stateManager.setSolverState("solvedFailed"),
    })
  },
}
