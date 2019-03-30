const display = {
  updateDraggablePiece: () => {
    const element = $(".draggable-piece")

    element.draggable(state.solverState === "selectPiece" ? "enable" : "disable")
    element.children("img").show()

    const placedList = state.fieldPieceList

    placedList.forEach((place) => {
      $("#piece_" + place.spin.pieceId + ">img").hide()
    })
  },

  updateButtons: () => {
    $("#start-button").prop(
      "disabled", state.solverState === "solving"
    ).toggle(
      (state.solverState === "selectPiece" && state.enableToStart)
        || state.solverState === "solving"
    )
    $("#more-piece-button").toggle(state.solverState === "selectPiece" && ! state.enableToStart)
    $("#reset-button").toggle(state.solverState === "solveEnd" || state.solverState === "pause")
  },

  updateFieldMask: () => {
    $("#field-mask").css(
      "left", config.offset.left + state.targetPieceList.length * config.cellSize
    ).css(
      "width", (12 - state.targetPieceList.length) * config.cellSize
    )
  },

  updateFieldPiece : () => {
    $(".katamino-piece").hide()

    const placedList = state.fieldPieceList

    placedList.forEach((place) => {
      $("#piece_" + place.spin.pieceId + "_" + place.spin.spinId).show(
      ).css("top", place.offset.x * config.cellSize + config.offset.top
      ).css("left", place.offset.y * config.cellSize + config.offset.left)
    })
  },

  updatePauseResumeButton: () => {
    // enable only solving
    $("#pause-button").prop("disabled", state.solverState !== "solving")
    // enable only pause
    $("#resume-button").prop("disabled", state.solverState !== "pause")
  },

  updateResultMessage: () => {
    $("#solvedModal").modal(state.solverState === "solveEnd" && state.result === "solved" ? "show" : "hide")
    $("#notSolvedModal").modal(state.solverState === "solveEnd" && state.result !== "solved" ? "show" : "hide")
  },
}
