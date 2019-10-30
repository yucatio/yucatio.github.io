$( function() {
  initializer.setEvent()
})

$(window).on('load', () => {
  initializer.setLayout()
})

const initializer = {
  setLayout: () => {
    $("#unused-piece-droppable").height($("#unused-piece-droppable").height())
    $("#used-piece-droppable").height($("#used-piece-droppable").height())
    $(".draggable-piece").each((index, piece) => {
      $(piece).width($(piece).width())
    })
  },

  setEvent: () => {
    $(".draggable-piece").draggable({
      revert: "invalid"
    })

    $("#unused-piece-droppable").droppable({
      hoverClass: "bg-light",
      accept: ".draggable-piece",
      drop : ((e, ui) => {
        const pieceId = ui.draggable.data("piece-id")
        action.removeFromTargetPieces(parseInt(pieceId, 10))
      }),
    })

    $("#used-piece-droppable").droppable({
      hoverClass: "hover",
      accept: ".draggable-piece",
      drop : ((e, ui) => {
        const pieceId = ui.draggable.data("piece-id")
        action.addToTargetPieces(parseInt(pieceId, 10))
      }),
    })

    $("#start-button").on("click", () => {
      action.startSolve()
    })

    $("#reset-button").on("click", () => {
      action.newPieceSelection()
    })

    $("#pause-button").on("click", () => {
      action.pause()
    })

    $("#resume-button").on("click", () => {
      action.resume()
    })

    $('#speed-range').on("change", () => {
      const speedLevel = $('#speed-range').val()
      action.changeSpeed(parseInt(speedLevel, 10))
    })
  },
}
