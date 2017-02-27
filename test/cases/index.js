'use strict'

var assign = require('lodash.assign')
var fixture = require('../fixture/activities.json')

function noop () {}

function A () {
  this.a = 3
  this.b = 4
}

var b = Object.create({b: 5})

var PRIMITIVES = [null, void 0, '', 'foo', NaN, 0, 5]

var PRIMITIVE_FIELDS = {
  someNull: null,
  someUndefined: void 0,
  someEmptyString: '',
  someNonEmptyString: 'foo',
  someNaN: NaN,
  some0: 0,
  some5: 5
}

var OBJECT_LIKE_FIELDS = {
  someEmptyObject: {},
  someObject: {foo: 'bar'},
  someDeepObject: {foo: {bar: 'baz'}},
  someEmptyArray: [],
  someNonEmptyArray: [0, null, 1]
}

var SOME_VALUES = PRIMITIVES.concat([noop])

var SOME_FIELDS = assign({}, PRIMITIVE_FIELDS, OBJECT_LIKE_FIELDS, {someFunction: noop})

module.exports = {
  'with incorrect mask': {
    'should throw /Incorrect mask/': {
      masks: [0, 1, NaN, [], {}],
      obj: {},
      error: /Incorrect mask/
    }
  },

  'masking empty mask': {
    'should **not** mask object': {
      masks: [void 0, null, ''],
      obj: {bar: 1, baz: undefined},
      result: {bar: 1, baz: undefined}
    },

    'should **not** mask array': {
      masks: [void 0, null, ''],
      obj: [{bar: 1, baz: undefined}, {}, null, 0, '', 'foo'],
      result: [{bar: 1, baz: undefined}, {}, null, 0, '', 'foo']
    },

    'should **not** mask undefined': {
      masks: [void 0, null, ''],
      obj: void 0,
      result: void 0
    },

    'should **not** mask null': {
      masks: [void 0, null, ''],
      obj: null,
      result: null
    },

    'should **not** mask 0': {
      masks: [void 0, null, ''],
      obj: 0,
      result: 0
    },

    'should **not** mask empty string': {
      masks: [void 0, null, ''],
      obj: '',
      result: ''
    },

    'should **not** mask string': {
      masks: [void 0, null, ''],
      obj: 'foo',
      result: 'foo'
    }
  },

  'masking primitives': {
    'should return null for undefined': {
      mask: 'name',
      obj: void 0,
      result: null
    },

    'should return null for null': {
      mask: 'name',
      obj: null,
      result: null
    },

    'should return null for empty string': {
      mask: 'length',
      obj: '',
      result: null
    },

    'should return null for "foo" string': {
      mask: 'length',
      obj: 'foo',
      result: null
    },

    'should return null for "bar" string': {
      mask: 'foo',
      obj: 'bar',
      result: null
    },

    'should return null for NaN': {
      mask: 'toString',
      obj: NaN,
      result: null
    },

    'should return null for number 0': {
      mask: 'toString',
      obj: 0,
      result: null
    },

    'should return null for number 1': {
      masks: ['foo', 'toString'],
      obj: 1,
      result: null
    },

    'should return null for function': {
      masks: ['foo', 'name'],
      obj: noop,
      result: null
    }
  },

  'masking objects': {
    'with single field masking': {
      'should return {} masking {}': {
        mask: 'foo',
        obj: {},
        result: {}
      },

      'should drop not matching field from object with one key': {
        mask: 'foo',
        obj: {bar: 1},
        result: {}
      },

      'should select field from object with one key': {
        mask: 'foo',
        obj: {foo: 1},
        result: {foo: 1}
      },

      'should select field with null value': {
        mask: 'foo',
        obj: {foo: null},
        result: {foo: null}
      },

      'should drop field with undefined value': {
        mask: 'foo',
        obj: {foo: void 0},
        result: {}
      },

      'should select matching field and drop not matching from object with several keys': {
        mask: 'foo',
        obj: assign({foo: 1}, SOME_FIELDS),
        result: {foo: 1}
      }
    },

    'with path and sub-selection': {
      'should return {} masking {}': {
        masks: ['foo/bar', 'foo(bar)'],
        obj: {},
        result: {}
      },

      'should drop not matching fields': {
        masks: ['foo/bar', 'foo(bar)'],
        obj: assign({
          boo: assign({bar: 'baz'}, SOME_FIELDS)
        }, SOME_FIELDS),
        result: {}
      },

      'should select fields': {
        masks: ['foo/bar', 'foo(bar)'],
        obj: assign({
          foo: assign({bar: 'baz'}, SOME_FIELDS)
        }, SOME_FIELDS),
        result: {foo: {bar: 'baz'}}
      },

      'should select deep fields': {
        masks: ['foo/bar/baz', 'foo(bar/baz)', 'foo/bar(baz)'],
        obj: assign({
          foo: assign({
            bar: {
              baz: 'baz'
            }
          }, SOME_FIELDS)
        }, SOME_FIELDS),
        result: {foo: {bar: {baz: 'baz'}}}
      }
    },

    'with comma-separated fields': {
      'should return {} masking {}': {
        mask: 'foo,bar',
        obj: {},
        result: {}
      },

      'should drop not matching fields': {
        mask: 'foo,bar',
        obj: assign({}, SOME_FIELDS),
        result: {}
      },

      'should select tow fields': {
        mask: 'foo,bar',
        obj: {foo: 'baz', bar: 0},
        result: {foo: 'baz', bar: 0}
      },

      'should select tow fields and drop others': {
        mask: 'foo,bar',
        obj: assign({foo: 'baz', bar: null}, SOME_FIELDS),
        result: {foo: 'baz', bar: null}
      }
    },

    'with sub-selection many fields from a parent': {
      'should return {} masking {}': {
        mask: 'foo(bar,baz)',
        obj: {},
        result: {}
      },

      'should drop not matching sub fields': {
        mask: 'foo(bar,baz)',
        obj: {foo: assign({}, SOME_FIELDS)},
        result: {foo: {}}
      },

      'should select matching sub fields': {
        mask: 'foo(bar,baz)',
        obj: {
          foo: assign({
            bar: 0, baz: 'bazz'
          }, SOME_FIELDS)
        },
        result: {foo: {bar: 0, baz: 'bazz'}}
      }
    }
  },

  'masking arrays': {
    'with not applicable values': {
      'should return [] for []': {
        mask: 'foo',
        obj: [],
        result: []
      },

      'should return [] for [null]': {
        mask: 'foo',
        obj: [null],
        result: []
      },

      'should return [] for [undefined]': {
        mask: 'foo',
        obj: [undefined],
        result: []
      },

      'should return [] for array of not object or array values': {
        masks: ['foo', 'name', 'toString'],
        obj: SOME_VALUES,
        result: []
      }
    },

    'should drop not matching objects fields in array': {
      mask: 'foo',
      obj: [{bar: 1}],
      result: [{}]
    },

    'should select matching object field in array': {
      mask: 'foo',
      obj: [{foo: 1}],
      result: [{foo: 1}]
    },

    'should **not** select matching objects fields in sub arrays': {
      mask: 'foo',
      obj: [[{foo: 1}], {foo: 2}],
      result: [[], {foo: 2}]
    },

    'should select fileld with array of undefined values': {
      mask: 'arr',
      obj: {arr: [void 0, void 0]},
      result: {arr: [void 0, void 0]}
    },

    'should select fileld with array of primitive values': {
      mask: 'arr',
      obj: {arr: PRIMITIVES},
      result: {arr: PRIMITIVES}
    },

    'should select matching objects fields in deep array': {
      masks: ['foo/bar/baz', 'foo(bar/baz)', 'foo(bar(baz))', 'foo(bar(baz,none),none)'],
      obj: {
        foo: {
          bar: SOME_VALUES.concat([{baz: 1}, {baz: 2}, {bom: 'bom'}])
        }
      },
      result: {
        foo: {
          bar: [{baz: 1}, {baz: 2}, {}]
        }
      }
    },

    'should select matching objects fields in array': {
      mask: 'foo,bar,boom(bam/sub,bom,none)',
      obj: [
        {foo: 1, baz: 'baz'},
        assign({foo: 5, bar: 'bar'}, SOME_FIELDS),
        SOME_FIELDS,
        {boom: {bam: {sub: 'sub'}, bom: 23}}
      ].concat(SOME_VALUES),
      result: [
        {foo: 1},
        {foo: 5, bar: 'bar'},
        {},
        {boom: {bam: {sub: 'sub'}, bom: 23}}
      ]
    }
  },

  'with wildcard "*"': {
    'should return {} masking {}': {
      masks: ['*', '*/*', 'a/*', '*(a/b/*)'],
      obj: {},
      result: {}
    },

    'should return [] masking []': {
      masks: ['*', '*/*', 'a/*', '*(a/b/*)'],
      obj: [],
      result: []
    },

    'should select all object fields with plain object or array values': {
      mask: '*',
      obj: assign({
        foo: {},
        bar: {baz: {}},
        arr0: [],
        arr1: [1]
      }, PRIMITIVE_FIELDS),
      result: {
        foo: {},
        bar: {baz: {}},
        arr0: [],
        arr1: [1]
      }
    },

    'should select sub fields': {
      masks: ['*/a', '*(a)'],
      obj: {
        foo: {a: 1},
        bar: [{a: 2, b: 3}, {b: 4}, [{a: 5}]].concat(PRIMITIVES)
      },
      result: {
        foo: {a: 1},
        bar: [{a: 2}, {}, []]
      }
    },

    'should select all object sub fields with plain object or array values': {
      mask: '*/*',
      obj: {
        foo: {
          a: 1,
          b: {},
          c: {field: 'some'},
          d: [1]
        },
        bar: 1
      },
      result: {
        foo: {
          b: {},
          c: {field: 'some'},
          d: [1]
        }
      }
    },

    'should select specified sub fields': {
      mask: '*(a,b)',
      obj: {
        foo: {a: 1},
        bar: {a: 1, b: 2, c: 3},
        baz: [{a: 4}, {c: 5}, {}].concat(PRIMITIVES),
        num: 3
      },
      result: {
        foo: {a: 1},
        bar: {a: 1, b: 2},
        baz: [{a: 4}, {}, {}]
      }
    },

    'should select specified deep sub field': {
      masks: ['foo/*/bar', 'foo(*/bar)', 'foo(*(bar))'],
      obj: {
        foo: assign({
          a: {bar: 1},
          b: [{bar: 2}],
          bar: 2
        }, PRIMITIVE_FIELDS),
        bar: {a: {bar: 1}},
        num: 3
      },
      result: {
        foo: {
          a: {bar: 1},
          b: [{bar: 2}]
        }
      }
    }
  },

  'with overlayed masks': {
    'should **not** select overlayed fields in object': {
      mask: 'foo/bar/baz',
      obj: {
        foo: {bar: 1}
      },
      result: {
        foo: {}
      }
    },

    'should **not** select overlayed fields in array': {
      mask: 'foo/arr/bar/baz',
      obj: {
        foo: {
          arr: [
            {bar: 1},
            {bar: {baz: 1}}
          ].concat(PRIMITIVES)
        }
      },
      result: {
        foo: {
          arr: [
            {},
            {bar: {baz: 1}}
          ]
        }
      }
    },

    'should select overlayed fields in object': {
      masks: ['foo/bar,foo/bar/baz', 'foo(bar,bar/baz)'],
      obj: {
        foo: {bar: 1}
      },
      result: {
        foo: {bar: 1}
      }
    },

    'should select overlayed fields in array': {
      masks: ['foo/arr/bar,foo/arr/bar/baz', 'foo/arr(bar,bar/baz)'],
      obj: {
        foo: {
          arr: [
            {bar: 1},
            {bar: {baz: 1}}
          ].concat(PRIMITIVES)
        }
      },
      result: {
        foo: {
          arr: [
            {bar: 1},
            {bar: {baz: 1}}
          ]
        }
      }
    },

    'should **not** select wildcard overlayed fields': {
      mask: '*/bar,arr/bar/baz',
      obj: {
        arr: [
          {bar: 2},
          {bar: {baz: 2}}
        ]
      },
      result: {
        arr: [
          {},
          {bar: {baz: 2}}
        ]
      }
    }
  },

  'with complex masks': {
    '(case #1) should select': {
      mask: 'id,person(name,age,documents/passport/number,details(account,tel))',
      obj: {
        id: 10001,
        code: 'user-101',
        person: assign({
          name: 'Alex',
          age: 20,
          documents: {
            passport: assign({serial: 123, number: 234567}, SOME_FIELDS),
            license: 'q876'
          },
          details: assign({
            account: 'ab1234',
            tel: '+123456789',
            country: 'Ireland'
          }, SOME_FIELDS)
        }, SOME_FIELDS)
      },
      result: {
        id: 10001,
        person: {
          name: 'Alex',
          age: 20,
          documents: {
            passport: {number: 234567}
          },
          details: {
            account: 'ab1234',
            tel: '+123456789'
          }
        }
      }
    },

    '(case #2) should select': {
      mask: 'url,obj(url,a/url)',
      obj: {
        url: 1,
        id: '1',
        obj: {url: 'h', a: [{url: 1, z: 2}], c: 3}
      },
      result: {
        url: 1,
        obj: {url: 'h', a: [{url: 1}]}}
    },

    '(case #3) should select': {
      mask: 'kind',
      obj: fixture,
      result: {kind: 'plus#activity'}
    },

    '(case #4) should select': {
      mask: 'object(objectType)',
      obj: fixture,
      result: {object: {objectType: 'note'}}
    },

    '(case #5) should select': {
      masks: [
        'url,object(content,attachments/url)',
        'object(content,attachments/url),url'
      ],
      obj: fixture,
      result: {
        url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL',
        object: {
          content: 'Congratulations! You have successfully fetched an explicit public activity. The attached video is your reward. :)',
          attachments: [
            {
              url: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }
          ]
        }
      }
    },

    '(case #6) should select': {
      mask: 'a/b',
      obj: {a: [new A(), b]},
      result: {a: [{b: 4}, {b: 5}]}
    }
  }
}

