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
  var curProp = {type: token.type}
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
