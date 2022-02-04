'use strict'

const URI = require('..')

const test = require('ava')

test('valid', function (t) {
  ;[
    'https://github.com/garycourt/uri-js',
    'magnet:?xt=urn:sha1:PDAQRAOQQRYS76MRZJ33LK4MMVZBDSCL',
    'https://🐀.ws/🐀🐀'
  ].forEach(function (url) {
    t.truthy(URI(url).protocol)
  })
})

test('invalid', function (t) {
  ;[undefined, null, false, ''].forEach(function (url) {
    t.is(URI(url), undefined)
  })
})
