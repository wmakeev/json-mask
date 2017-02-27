/* global describe, it */

var assert = require('assert')
var util = require('../lib/util')

describe('internal util', function () {
  describe('isEmpty', function () {
    it('should return true for null', function () {
      assert.equal(util.isEmpty(null), true)
    })

    it('should return true for empty object {}', function () {
      assert.equal(util.isEmpty({}), true)
    })

    it('should return false for not empty object', function () {
      assert.equal(util.isEmpty({a: 1}), false)
    })

    it('should return true for empty object with not empty prototype', function () {
      var obj = Object.create({a: 1})
      assert.equal(util.isEmpty(obj), true)
    })
  })

  describe('isArray', function () {
    it('should return true array', function () {
      assert.equal(util.isArray([]), true)
      assert.equal(util.isArray([1, 2, 3]), true)
    })

    it('should return fasle for not array', function () {
      assert.equal(util.isArray(0), false)
      assert.equal(util.isArray(1), false)
      assert.equal(util.isArray(null), false)
      assert.equal(util.isArray(arguments), false)
      assert.equal(util.isArray(NaN), false)
      assert.equal(util.isArray({}), false)
    })

    it('should use polyfill if Array.isArray not present', function () {
      var isArray = Array.isArray
      Array.isArray = undefined
      delete require.cache['/Users/mvv/Documents/GitHub/json-mask/lib/util.js']
      util = require('../lib/util')
      assert.equal(util.isArray([]), true)
      assert.equal(util.isArray([1, 2, 3]), true)
      assert.equal(util.isArray(0), false)
      assert.equal(util.isArray(1), false)
      assert.equal(util.isArray(null), false)
      assert.equal(util.isArray(arguments), false)
      assert.equal(util.isArray(NaN), false)
      assert.equal(util.isArray({}), false)
      Array.isArray = isArray
      delete require.cache['/Users/mvv/Documents/GitHub/json-mask/lib/util.js']
      util = require('../lib/util')
    })
  })
})
