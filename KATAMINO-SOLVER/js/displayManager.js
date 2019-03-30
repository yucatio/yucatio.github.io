const displayManager = {
  solverStateChanged: () => {
    display.updateDraggablePiece()
    display.updateButtons()
    display.updateFieldMask()
    display.updateFieldPiece()
    display.updatePauseResumeButton()
    display.updateResultMessage()
  },

  targetPieceListUpdated: () => {
    display.updateButtons()
    display.updateFieldMask()
  },

  fieldPieceUpdated: () => {
    display.updateDraggablePiece()
    display.updateFieldPiece()
  },
}
