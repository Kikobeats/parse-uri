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

test('empty relative path', t => {
  // Test URLs that have no path/relative component
  const testCases = [
    'https://example.com',
    'http://localhost',
    'ftp://files.example.com'
  ]

  testCases.forEach(url => {
    const result = parseURI(url)
    t.truthy(result)
    t.is(result.path, '')
    t.is(result.directory, '')
    t.is(result.file, '')
    t.is(result.relative, '')
  })
})

test('path without directory structure', t => {
  // Test URLs/paths that have a relative path but no directory separators
  const testCases = ['filename.txt', 'document', 'index.html']

  testCases.forEach(url => {
    const result = parseURI(url, { strictMode: true })
    t.truthy(result)
    t.is(result.path, url)
    t.is(result.directory, '')
    t.is(result.file, url)
    t.is(result.relative, url)
  })
})

test('regex match failure edge cases', t => {
  // Test extreme edge cases that might cause regex to fail
  const extremeCases = [
    // Very large strings that might cause regex engine issues
    'x'.repeat(100000),
    // Strings with many nested groups that might cause backtracking
    '('.repeat(1000) + ')'.repeat(1000),
    // Unicode edge cases
    '\uD800', // lone high surrogate
    '\uDFFF', // lone low surrogate
    // Null bytes and control characters in unusual combinations
    '\0'.repeat(1000),
    // String that might trigger regex engine limits
    'a:'.repeat(10000) + '@'.repeat(10000)
  ]

  extremeCases.forEach(testCase => {
    // These should either parse successfully or return undefined
    // The point is to test the defensive null check in line 37
    const result = parseURI(testCase)
    // Should not throw an error and result should be defined or undefined
    t.true(result === undefined || typeof result === 'object')
  })
})
