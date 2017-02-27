var ObjProto = Object.prototype

exports.isEmpty = isEmpty
exports.isArray = Array.isArray || isArray
exports.isPlainObject = isPlainObject

function isEmpty (obj) {
  if (obj == null) return true
  for (var key in obj) {
    /* istanbul ignore else */
    if (obj.hasOwnProperty(key)) return false
  }
  return true
}

function isArray (obj) {
  return ObjProto.toString.call(obj) === '[object Array]'
}

function isPlainObject (obj) {
  return ObjProto.toString.call(obj) === '[object Object]'
}
