const display = {
  updateDraggablePieces: ({solverState, placedPieces}) => {
    $(".draggable-piece").draggable(solverState === "selectPiece" ? "enable" : "disable")

    $(".draggable-piece").children("img").show()
    placedPieces.forEach((place) => {
      $("#piece_" + place.pieceId + ">img").hide()
    })
  },

  updateStartButtons: ({solverState, targetPieces}) => {
    $("#start-button").prop(
      "disabled", solverState === "solving"
    ).toggle(
      (solverState === "selectPiece" && targetPieces.length >= 3) || solverState === "solving"
    )
    $("#more-piece-button").toggle(targetPieces.length < 3)
    $("#reset-button").toggle(
      solverState === "solvedSuccess" || solverState === "solvedFailed" || solverState === "pause"
    )
  },

  updateFieldMask: ({targetPieces}) => {
    $("#field-mask").css(
      "left", targetPieces.length * config.cellSize + config.fieldOffset.left
    ).css(
      "width", (12 - targetPieces.length) * config.cellSize
    )
  },

  updateFieldPieces: ({placedPieces}) => {
    $(".katamino-piece").hide()
    placedPieces.forEach((piece) => {
      $("#piece_" + piece.pieceId + "_" + piece.spinId
      ).css("top", piece.offset.x * config.cellSize + config.fieldOffset.top
      ).css("left", piece.offset.y * config.cellSize + config.fieldOffset.left
      ).show()
    })
  },

  updatePauseResumeButton: ({solverState}) => {
    $("#pause-button").prop("disabled", solverState !== "solving")
    $("#resume-button").prop("disabled", solverState !== "pause")
  },

  updateResultMessage: ({solverState}) => {
    $("#solved-modal").modal(solverState === "solvedSuccess" ? "show" : "hide")
    $("#not-solved-modal").modal(solverState === "solvedFailed" ? "show" : "hide")
  },
}
