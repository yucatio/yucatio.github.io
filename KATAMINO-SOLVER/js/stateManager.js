const stateManager = {
  setSolverState: (solverState) => {
    state.solverState = solverState

    display.updateDraggablePieces(state)
    display.updateStartButtons(state)
    display.updatePauseResumeButton(state)
    display.updateResultMessage(state)
  },

  setTargetPieces: (targetPieces) => {
    state.targetPieces = targetPieces

    display.updateStartButtons(state)
    display.updateFieldMask(state)
  },

  setPlacedPieces: (placedPieces) => {
    state.placedPieces = placedPieces

    display.updateDraggablePieces(state)
    display.updateFieldPieces(state)
  },
}
