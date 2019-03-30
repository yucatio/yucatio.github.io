const KATAMINO_ARR = [[{"pieceId":0,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":0,"y":3},{"x":0,"y":4}],"xLength":1,"yLength":5},{"pieceId":0,"spinId":1,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0},{"x":3,"y":0},{"x":4,"y":0}],"xLength":5,"yLength":1}],[{"pieceId":1,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":0,"y":3},{"x":1,"y":0}],"xLength":2,"yLength":4},{"pieceId":1,"spinId":1,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0},{"x":3,"y":0},{"x":3,"y":1}],"xLength":4,"yLength":2},{"pieceId":1,"spinId":2,"place":[{"x":0,"y":3},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":1,"y":3}],"xLength":2,"yLength":4},{"pieceId":1,"spinId":3,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":1}],"xLength":4,"yLength":2},{"pieceId":1,"spinId":4,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":1,"y":3}],"xLength":2,"yLength":4},{"pieceId":1,"spinId":5,"place":[{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":0},{"x":3,"y":1}],"xLength":4,"yLength":2},{"pieceId":1,"spinId":6,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":0,"y":3},{"x":1,"y":3}],"xLength":2,"yLength":4},{"pieceId":1,"spinId":7,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":0},{"x":2,"y":0},{"x":3,"y":0}],"xLength":4,"yLength":2}],[{"pieceId":2,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":0,"y":3},{"x":1,"y":1}],"xLength":2,"yLength":4},{"pieceId":2,"spinId":1,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0},{"x":2,"y":1},{"x":3,"y":0}],"xLength":4,"yLength":2},{"pieceId":2,"spinId":2,"place":[{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":1,"y":3}],"xLength":2,"yLength":4},{"pieceId":2,"spinId":3,"place":[{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":1}],"xLength":4,"yLength":2},{"pieceId":2,"spinId":4,"place":[{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":1,"y":3}],"xLength":2,"yLength":4},{"pieceId":2,"spinId":5,"place":[{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":2,"y":1},{"x":3,"y":1}],"xLength":4,"yLength":2},{"pieceId":2,"spinId":6,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":0,"y":3},{"x":1,"y":2}],"xLength":2,"yLength":4},{"pieceId":2,"spinId":7,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":0},{"x":3,"y":0}],"xLength":4,"yLength":2}],[{"pieceId":3,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":2},{"x":1,"y":3}],"xLength":2,"yLength":4},{"pieceId":3,"spinId":1,"place":[{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":0},{"x":3,"y":0}],"xLength":4,"yLength":2},{"pieceId":3,"spinId":2,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":1,"y":2},{"x":1,"y":3}],"xLength":2,"yLength":4},{"pieceId":3,"spinId":3,"place":[{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":2,"y":1},{"x":3,"y":0}],"xLength":4,"yLength":2},{"pieceId":3,"spinId":4,"place":[{"x":0,"y":2},{"x":0,"y":3},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2}],"xLength":2,"yLength":4},{"pieceId":3,"spinId":5,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":1}],"xLength":4,"yLength":2},{"pieceId":3,"spinId":6,"place":[{"x":0,"y":1},{"x":0,"y":2},{"x":0,"y":3},{"x":1,"y":0},{"x":1,"y":1}],"xLength":2,"yLength":4},{"pieceId":3,"spinId":7,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0},{"x":2,"y":1},{"x":3,"y":1}],"xLength":4,"yLength":2}],[{"pieceId":4,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":0},{"x":2,"y":0}],"xLength":3,"yLength":3},{"pieceId":4,"spinId":1,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0},{"x":2,"y":1},{"x":2,"y":2}],"xLength":3,"yLength":3},{"pieceId":4,"spinId":2,"place":[{"x":0,"y":2},{"x":1,"y":2},{"x":2,"y":0},{"x":2,"y":1},{"x":2,"y":2}],"xLength":3,"yLength":3},{"pieceId":4,"spinId":3,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":2},{"x":2,"y":2}],"xLength":3,"yLength":3}],[{"pieceId":5,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1}],"xLength":2,"yLength":3},{"pieceId":5,"spinId":1,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":0},{"x":2,"y":1}],"xLength":3,"yLength":2},{"pieceId":5,"spinId":2,"place":[{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2}],"xLength":2,"yLength":3},{"pieceId":5,"spinId":3,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":1}],"xLength":3,"yLength":2},{"pieceId":5,"spinId":4,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2}],"xLength":2,"yLength":3},{"pieceId":5,"spinId":5,"place":[{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":0},{"x":2,"y":1}],"xLength":3,"yLength":2},{"pieceId":5,"spinId":6,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":1},{"x":1,"y":2}],"xLength":2,"yLength":3},{"pieceId":5,"spinId":7,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":0}],"xLength":3,"yLength":2}],[{"pieceId":6,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":2}],"xLength":2,"yLength":3},{"pieceId":6,"spinId":1,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":0},{"x":2,"y":0},{"x":2,"y":1}],"xLength":3,"yLength":2},{"pieceId":6,"spinId":2,"place":[{"x":0,"y":0},{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2}],"xLength":2,"yLength":3},{"pieceId":6,"spinId":3,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":2,"y":1}],"xLength":3,"yLength":2}],[{"pieceId":7,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":1},{"x":2,"y":2}],"xLength":3,"yLength":3},{"pieceId":7,"spinId":1,"place":[{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":0}],"xLength":3,"yLength":3},{"pieceId":7,"spinId":2,"place":[{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":1},{"x":2,"y":0},{"x":2,"y":1}],"xLength":3,"yLength":3},{"pieceId":7,"spinId":3,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":2}],"xLength":3,"yLength":3}],[{"pieceId":8,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":1}],"xLength":3,"yLength":3},{"pieceId":8,"spinId":1,"place":[{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":0}],"xLength":3,"yLength":3},{"pieceId":8,"spinId":2,"place":[{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":1},{"x":2,"y":2}],"xLength":3,"yLength":3},{"pieceId":8,"spinId":3,"place":[{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":1}],"xLength":3,"yLength":3},{"pieceId":8,"spinId":4,"place":[{"x":0,"y":1},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":0},{"x":2,"y":1}],"xLength":3,"yLength":3},{"pieceId":8,"spinId":5,"place":[{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":2}],"xLength":3,"yLength":3},{"pieceId":8,"spinId":6,"place":[{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":1}],"xLength":3,"yLength":3},{"pieceId":8,"spinId":7,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":1}],"xLength":3,"yLength":3}],[{"pieceId":9,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":1},{"x":2,"y":1}],"xLength":3,"yLength":3},{"pieceId":9,"spinId":1,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":0}],"xLength":3,"yLength":3},{"pieceId":9,"spinId":2,"place":[{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":2,"y":1},{"x":2,"y":2}],"xLength":3,"yLength":3},{"pieceId":9,"spinId":3,"place":[{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":2}],"xLength":3,"yLength":3}],[{"pieceId":10,"spinId":0,"place":[{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":2}],"xLength":3,"yLength":3},{"pieceId":10,"spinId":1,"place":[{"x":0,"y":1},{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":0}],"xLength":3,"yLength":3},{"pieceId":10,"spinId":2,"place":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":1},{"x":2,"y":2}],"xLength":3,"yLength":3},{"pieceId":10,"spinId":3,"place":[{"x":0,"y":2},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":0},{"x":2,"y":1}],"xLength":3,"yLength":3}],[{"pieceId":11,"spinId":0,"place":[{"x":0,"y":1},{"x":1,"y":0},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":1}],"xLength":3,"yLength":3}]]
