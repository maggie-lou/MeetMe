exports.generateUniqueID = () => {
  // Convert random number to base 36 (numbers + letters) and grab first 9 characters after the decimal
  return '_' + Math.random().toString(36).substr(2, 9);
}

exports.clone = function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
