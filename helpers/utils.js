exports.generateUniqueID = () => {
  // Convert random number to base 36 (numbers + letters) and grab first 9 characters after the decimal
  return '_' + Math.random().toString(36).substr(2, 9);
}

exports.clone = function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

exports.makeUL = function makeUL(arr) {
  var list = document.createElement('ul');

  for (var i = 0; i < arr.length; i++) {
    var item = document.createElement('li');
    item.appendChild(document.createTextNode(arr[i]));
    list.appendChild(item);
  }

  return list;
}

exports.difference = function difference(arr1, arr2) {
  return arr1.filter(x => !arr2.includes(x));
}
