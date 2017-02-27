/**
 * json-mask | (c) 2015 Yuriy Nemtsov | https://github.com/nemtsov/json-mask/blob/master/LICENSE
 * @license
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jsonMask = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var util = require('./util')
var TERMINALS = {',': 1, '/': 2, '(': 3, ')': 4}

module.exports = compile

/**
 *  Compiler
 *
 *  Grammar:
 *     Props ::= Prop | Prop "," Props
 *      Prop ::= Object | Array
 *    Object ::= NAME | NAME "/" Object
 *     Array ::= NAME "(" Props ")"
 *      NAME ::= ? all visible characters ?
 *
 *  Examples:
 *    a
 *    a,d,g
 *    a/b/c
 *    a(b)
 *    ob,a(k,z(f,g/d)),d
 */

function compile (text) {
  if (text == null || text === '') return null
  if (typeof text !== 'string') {
    throw new Error('Incorrect mask "' + text + '"')
  }
  return parse(scan(text))
}

function scan (text) {
  var i = 0
  var len = text.length
  var tokens = []
  var name = ''
  var ch

  function maybePushName () {
    if (!name) return
    tokens.push({tag: '_n', value: name})
    name = ''
  }

  for (; i < len; i++) {
    ch = text.charAt(i)
    if (TERMINALS[ch]) {
      maybePushName()
      tokens.push({tag: ch})
    } else {
      name += ch
    }
  }
  maybePushName()

  return tokens
}

function parse (tokens) {
  var stack = []
  var tree = _buildTree(tokens, {}, stack)
  if (stack.length) {
    throw new Error('Incorrect mask: unclosed "' + stack.pop().tag + '" found')
  }
  return tree
}

function _buildTree (tokens, parent, stack) {
  var props = {}
  var token
  var peek

  while ((token = tokens.shift())) {
    if (token.tag === '_n') {
      token.type = 'object'
      peek = stack[stack.length - 1]
      token.properties = _buildTree(tokens, token, stack)
      // exit if in object stack
      if (peek && (peek.tag === '/')) {
        stack.pop()
        _addToken(token, props)
        return props
      }
      _addToken(token, props)
    } else if (token.tag === ',') {
      return props
    } else if (token.tag === '(') {
      stack.push(token)
      parent.type = 'array'
      continue
    } else if (token.tag === ')') {
      if (stack.pop() === undefined) {
        throw new Error('Incorrect mask: unexpected ")" found')
      }
      return props
    } else { // token.tag === '/'
      stack.push(token)
      continue
    }
  }

  return props
}

function _addToken (token, props) {
  var curProp = { type: token.type }
  if (!util.isEmpty(token.properties)) {
    curProp.properties = token.properties
  }
  if (props[token.value]) {
    mergeTrees(props[token.value], curProp, token.value === '*')
  } else {
    props[token.value] = curProp
  }
}

function mergeTrees (target, src, isTargetWildcard) {
  var targetProps = target.properties
  var srcProps = src.properties

  target.type = (target.type === 'array' || (targetProps && srcProps))
    ? 'array' : src.type

  // wildcards "*" can't be overlapped
  if (!targetProps !== !srcProps && !isTargetWildcard) target.overlapped = true

  if (srcProps) {
    if (targetProps) {
      for (var p in srcProps) {
        if (targetProps.hasOwnProperty(p)) {
          mergeTrees(targetProps[p], srcProps[p], p === '*')
        } else {
          targetProps[p] = srcProps[p]
        }
      }
    } else {
      target.properties = srcProps
    }
  }
}

},{"./util":4}],2:[function(require,module,exports){
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

},{"./util":4}],3:[function(require,module,exports){
var compile = require('./compiler')
var filter = require('./filter')

function mask (obj, mask) {
  return filter(obj, compile(mask))
}

mask.compile = compile
mask.filter = filter

module.exports = mask

},{"./compiler":1,"./filter":2}],4:[function(require,module,exports){
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

},{}]},{},[3])(3)
});
