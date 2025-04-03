'use strict'

const parseURI = require('..')

const test = require('ava')

test('valid', t => {
  ;[
    'https://github.com/garycourt/uri-js',
    'magnet:?xt=urn:sha1:PDAQRAOQQRYS76MRZJ33LK4MMVZBDSCL',
    'https://🐀.ws/🐀🐀'
  ].forEach(function (url) {
    t.truthy(parseURI(url).protocol)
  })
})

test('invalid', t => {
  ;[undefined, null, false, ''].forEach(function (url) {
    t.is(parseURI(url), undefined)
  })
})

test('avoid DoS attacks', t => {
  const input = '0' + '@/@.44'.repeat(45502) + '\x00.'.repeat(45502)
  const now = new Date()
  parseURI(input)
  t.true(Date.now() - now < 1000)
  console.time('[ + ] Time passed -> ')
})
