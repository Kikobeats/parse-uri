/* global describe, it */

'use strict'

var URI = require('..')
var should = require('should')

describe('parse uri', function () {
  it('valid', function () {
    ;[
      'https://github.com/garycourt/uri-js',
      'magnet:?xt=urn:sha1:PDAQRAOQQRYS76MRZJ33LK4MMVZBDSCL',
      'https://🐀.ws/🐀🐀'
    ].forEach(function (url) {
      should(URI(url).protocol).be.ok()
    })
  })

  it('invalid', function () {
    ;[undefined, null, false, ''].forEach(function (url) {
      should(URI(url)).be.undefined()
    })
  })
})
