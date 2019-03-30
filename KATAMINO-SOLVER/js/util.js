const util = {
  copyArrayOfArray : (arrayOfArray) => {
    return arrayOfArray.map(array => array.concat())
  },

  addToUniqArray: (array, value) => {
    const index = array.indexOf(value)
    if (index < 0) {
      array.push(value)
      return true
    }

    return false
  },

  removeFromArray: (array, value) => {
    const index = array.indexOf(value)
    if (index >= 0) {
      array.splice(index, 1)
    }
    return index
  },
}
