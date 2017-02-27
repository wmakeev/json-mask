/* global describe, it */

var assert = require('assert')
var filter = require('../filter')
var compiledMask
var object
var expected

function noop () {}

// a,b(d/*/z,b(g)),e(v(name),g/name),c,e/g
compiledMask = {
  'a': {
    'type': 'object'
  },
  'b': {
    'type': 'array',
    'properties': {
      'd': {
        'type': 'object',
        'properties': {
          '*': {
            'type': 'object',
            'properties': {
              'z': {
                'type': 'object'
              }
            }
          }
        }
      },
      'b': {
        'type': 'array',
        'properties': {
          'g': {
            'type': 'object'
          }
        }
      }
    }
  },
  'e': {
    'type': 'array',
    'properties': {
      'v': {
        'type': 'array',
        'properties': {
          'name': {
            'type': 'object'
          }
        }
      }
    }
  },
  'f': {
    'type': 'array',
    'properties': {
      'g': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'object'
          }
        },
        'overlapped': true
      }
    }
  },
  'c': {
    'type': 'object'
  }
}

object = {
  a: 11,
  n: 0,
  b: [
    {
      d: {
        g: {z: 22},
        b: 34,
        c: {a: 32}
      },
      b: [{z: 33}],
      k: 99
    },
    {d: 51}
  ],
  e: [
    {v: {name: 'foo'}},
    {v: 1},
    {v: noop},
    {v: 0},
    {v: null},
    {v: undefined}
  ],
  f: [
    {g: {name: 'foo'}},
    {g: 1},
    {g: noop},
    {g: 0},
    {g: null},
    {g: undefined}
  ],
  c: 44,
  g: 99
}

expected = {
  a: 11,
  b: [
    {
      d: {
        g: {z: 22},
        c: {}
      },
      b: [{}]
    },
    {}
  ],
  e: [
    {v: {name: 'foo'}},
    {},
    {},
    {},
    {v: null},
    {}
  ],
  f: [
    {g: {name: 'foo'}},
    {g: 1},
    {g: noop},
    {g: 0},
    {g: null},
    {}
  ],
  c: 44
}

describe('filter', function () {
  it('should filter object for a compiled mask', function () {
    assert.deepEqual(filter(object, compiledMask), expected)
  })
})
