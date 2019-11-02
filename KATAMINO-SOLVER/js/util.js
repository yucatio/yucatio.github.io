const util = {
  copyArrayOfArray : (arrayOfArray) => {
    return arrayOfArray.map(array => ([...array]))
  },
}
