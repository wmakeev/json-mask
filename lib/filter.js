var util = require('./util')

module.exports = filter

function filter (obj, compiledMask) {
  if (!compiledMask && !util.isPlainObject(compiledMask)) {
    return obj
  }
  if (util.isArray(obj)) {
    return _arrayProperties(obj, compiledMask)
  } else if (util.isPlainObject(obj)) {
    return _properties(obj, compiledMask)
  } else {
    return null
  }
}

// wrap array & mask in a temp object;
// extract results from temp at the end
function _arrayProperties (arr, mask) {
  var obj = _properties({_: arr}, {_: {
    type: 'array',
    properties: mask
  }})
  return obj && obj._
}

function _properties (obj, mask, overlapped) {
  var maskedObj, key, value, ret, retKey, typeFunc
  if (obj == null || !mask) return obj

  if (util.isArray(obj)) maskedObj = []
  else if (util.isPlainObject(obj)) maskedObj = {}
  else if (overlapped) return obj
  else return void 0

  for (key in mask) {
    value = mask[key]
    ret = void 0
    typeFunc = (value.type === 'object') ? _object : _array
    if (key === '*') {
      ret = _forAll(obj, value.properties, typeFunc)
      for (retKey in ret) {
        maskedObj[retKey] = ret[retKey]
      }
    } else {
      ret = typeFunc(obj, key, value.properties, value.overlapped)
      if (typeof ret !== 'undefined') maskedObj[key] = ret
    }
  }
  return maskedObj
}

function _forAll (obj, mask, fn) {
  var ret = {}
  var key
  var value
  for (key in obj) {
    value = fn(obj, key, mask)
    if (util.isArray(value) || util.isPlainObject(value)) ret[key] = value
  }
  return ret
}

function _object (obj, key, mask, overlapped) {
  var value = obj[key]
  if (mask) {
    return util.isArray(value)
      ? _array(obj, key, mask, overlapped)
      : _properties(value, mask, overlapped)
  } else {
    return value
  }
}

function _array (object, key, mask, overlapped) {
  var ret = []
  var arr = object[key]
  var obj
  var maskedObj
  var i
  var l
  if (util.isArray(arr)) {
    if (arr.length === 0) return arr
    for (i = 0, l = arr.length; i < l; i++) {
      obj = arr[i]
      maskedObj = _properties(obj, mask, overlapped)
      if (util.isArray(maskedObj) || util.isPlainObject(maskedObj)) ret.push(maskedObj)
    }
    return ret
  } else {
    return _properties(arr, mask, overlapped)
  }
}
