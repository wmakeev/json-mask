/* global describe, it */

var assert = require('assert')
var jsonMask = require('../lib')
var indexCases = require('./cases/index')

function _describe (caseName, subCases) {
  var test, masks, c
  if (subCases.hasOwnProperty('mask') || subCases.hasOwnProperty('masks')) {
    test = subCases
    masks = test.masks || [test.mask]

    masks.forEach(function (mask) {
      var strMask = typeof mask === 'string' || typeof mask === 'number'
        ? '"' + mask + '"' : Object.prototype.toString.call(mask)
      it(caseName + ' with ' + strMask + ' mask', function () {
        var result
        if (test.hasOwnProperty('result')) {
          result = jsonMask(test.obj, mask)
          assert.deepStrictEqual(result, test.result)
        } else if (test.error) {
          assert.throws(function () {
            jsonMask(test.obj, mask)
          }, test.error)
        }
      })
    })
  } else {
    describe(caseName, function () {
      for (c in subCases) {
        if (!subCases.hasOwnProperty(c)) { continue }
        ;(function (_subCaseName, _subCases) {
          _describe(_subCaseName, _subCases)
        })(c, subCases[c])
      }
    })
  }
}

_describe('json-mask', indexCases)
