/* global describe, it */

var assert = require('assert')
var compile = require('../compiler')

var tests = {
  'a': {a: {type: 'object'}},
  'a,b,c': {
    a: {type: 'object'},
    b: {type: 'object'},
    c: {type: 'object'}
  },
  'a/*/c': {
    a: {
      type: 'object',
      properties: {
        '*': {
          type: 'object',
          properties: {
            c: {type: 'object'}
          }
        }
      }
    }
  },
  'a,b(d/*/g,b),c': {
    a: {type: 'object'},
    b: {
      type: 'array',
      properties: {
        d: {
          type: 'object',
          properties: {
            '*': {
              type: 'object',
              properties: {
                g: {type: 'object'}
              }
            }
          }
        },
        b: {type: 'object'}
      }
    },
    c: {type: 'object'}
  },
  'a/*/g,a/*': {
    a: {
      type: 'array',
      properties: {
        '*': {
          type: 'object',
          properties: {
            g: {
              type: 'object'
            }
          }
        }
      }
    }
  }
}

var similarMasks = [
  'a,a/b,a/b/c,a/b/d,e,a/f',
  'a,a/f,a/b,a/b(c,d),e',
  'a,a(b,b/c,f,b/d),e',
  'a,a(b,b(c,d),f),e',
  'e,a,a(b,b(c,d),f)',
  'a/f,e,a(b(d,c),b),a',
  'a(f,b(d,c),b),e,a'
]

var incorrectMasks = {
  'a(b,c': /unclosed "\("/,
  'a,b)': /unexpected "\)"/,
  'a/(b,c)': /unclosed "\/"/
}

describe('compiler', function () {
  for (var name in tests) {
    (function (name, test) {
      it('should compile ' + name, function () {
        assert.deepEqual(compile(name), test)
      })
    }(name, tests[name]))
  }

  describe('should return same trees', function () {
    it('for mask "' + similarMasks[0] + '"', function () {})
    var compiledTree = compile(similarMasks.shift())
    similarMasks.forEach(function (mask) {
      var curTree = compile(mask)
      it('for mask "' + mask + '"', function () {
        assert.deepEqual(compiledTree, curTree)
      })
      return curTree
    }, compile(similarMasks[0]))
  })

  describe('incorrect mask', function () {
    var mask, error
    for (mask in incorrectMasks) {
      error = incorrectMasks[mask]
      it('should throw ' + error.toString() + ' for mask "' + mask + '"',
        (function (_mask, _error) {
          return function () {
            assert.throws(function () {
              compile(_mask)
            }, _error)
          }
        })(mask, error))
    }
  })
})
