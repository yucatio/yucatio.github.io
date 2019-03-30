$( function() {
  initializer.setLayout()
  initializer.setEvent()

  action.init()
});

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
        const pieceIdStr = ui.draggable.data("piece-id")
        action.removeFromTargetPieceList(parseInt(pieceIdStr, 10))
      })
    })

    $("#used-piece-droppable").droppable({
      hoverClass: "hover",
      accept: ".draggable-piece",
      drop : ((e, ui) => {
        const pieceIdStr = ui.draggable.data("piece-id")
        action.addToTargetPieceList(parseInt(pieceIdStr, 10))
      })
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
      const speed = $('#speed-range').val()
      action.changeSpeed(speed)
    });

  },

}
