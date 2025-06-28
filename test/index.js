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
  t.true(Date.now() - now < 100)
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

test('mailto:john@example.com', t => {
  const result = parseURI('mailto:john@example.com')
  t.truthy(result)
  t.is(result.protocol, 'mailto')
  t.is(result.authority, '')
  t.is(result.relative, 'john@example.com')
  t.is(result.path, 'john@example.com')
  t.is(result.file, 'john@example.com')
  t.is(result.query, '')
  t.deepEqual(result.queryKey, {})
})

test('mailto:test@domain.com?subject=Hello&body=World', t => {
  const result = parseURI('mailto:test@domain.com?subject=Hello&body=World')
  t.truthy(result)
  t.is(result.protocol, 'mailto')
  t.is(result.authority, '')
  t.is(result.relative, 'test@domain.com')
  t.is(result.path, 'test@domain.com')
  t.is(result.file, 'test@domain.com')
  t.is(result.query, 'subject=Hello&body=World')
  t.deepEqual(result.queryKey, { subject: 'Hello', body: 'World' })
})

test('tel:+1-555-123-4567', t => {
  const result = parseURI('tel:+1-555-123-4567')
  t.truthy(result)
  t.is(result.protocol, 'tel')
  t.is(result.relative, '+1-555-123-4567')
})

test('tel:555-1234', t => {
  const result = parseURI('tel:555-1234')
  t.truthy(result)
  t.is(result.protocol, 'tel')
  t.is(result.relative, '555-1234')
})

test('ftp://ftp.example.com/path/file.txt', t => {
  const result = parseURI('ftp://ftp.example.com/path/file.txt')
  t.truthy(result)
  t.is(result.protocol, 'ftp')
  t.is(result.authority, 'ftp.example.com')
  t.is(result.relative, '/path/file.txt')
  t.is(result.host, 'ftp.example.com')
})

test('ftp://user:pass@ftp.example.com:21/dir/', t => {
  const result = parseURI('ftp://user:pass@ftp.example.com:21/dir/')
  t.truthy(result)
  t.is(result.protocol, 'ftp')
  t.is(result.authority, 'user:pass@ftp.example.com:21')
  t.is(result.host, 'ftp.example.com')
  t.is(result.port, '21')
  t.is(result.user, 'user')
  t.is(result.password, 'pass')
})

test('file:///path/to/file.txt', t => {
  const result = parseURI('file:///path/to/file.txt')
  t.truthy(result)
  t.is(result.protocol, 'file')
  t.is(result.authority, '')
  t.is(result.relative, '/path/to/file.txt')
})

test('file://localhost/path/to/file.txt', t => {
  const result = parseURI('file://localhost/path/to/file.txt')
  t.truthy(result)
  t.is(result.protocol, 'file')
  t.is(result.authority, 'localhost')
  t.is(result.relative, '/path/to/file.txt')
  t.is(result.host, 'localhost')
})

test('data:text/plain;base64,SGVsbG8gV29ybGQ=', t => {
  const result = parseURI('data:text/plain;base64,SGVsbG8gV29ybGQ=')
  t.truthy(result)
  t.is(result.protocol, 'data')
  t.is(result.relative, 'text/plain;base64,SGVsbG8gV29ybGQ=')
})

test('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', t => {
  const result = parseURI('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...')
  t.truthy(result)
  t.is(result.protocol, 'data')
  t.is(result.relative, 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...')
})

test('javascript:alert("Hello World")', t => {
  const result = parseURI('javascript:alert("Hello World")')
  t.truthy(result)
  t.is(result.protocol, 'javascript')
  t.is(result.relative, 'alert("Hello World")')
})

test('myapp://action/path?param=value', t => {
  const result = parseURI('myapp://action/path?param=value')
  t.truthy(result)
  t.is(result.protocol, 'myapp')
  t.is(result.authority, 'action')
  t.is(result.relative, '/path')
  t.is(result.query, 'param=value')
})

test('steam://rungameid/12345', t => {
  const result = parseURI('steam://rungameid/12345')
  t.truthy(result)
  t.is(result.protocol, 'steam')
  t.is(result.authority, 'rungameid')
  t.is(result.relative, '/12345')
})

test('http2://example.com/path', t => {
  const result = parseURI('http2://example.com/path')
  t.truthy(result)
  t.is(result.protocol, 'http2')
  t.is(result.authority, 'example.com')
  t.is(result.relative, '/path')
})

test('mailto: (empty protocol content)', t => {
  const result = parseURI('mailto:')
  t.truthy(result)
  t.is(result.protocol, 'mailto')
  t.is(result.relative, '')
})

test('verylongprotocolname://example.com', t => {
  const result = parseURI('verylongprotocolname://example.com')
  t.truthy(result)
  t.is(result.protocol, 'verylongprotocolname')
  t.is(result.authority, 'example.com')
})

test('custom:?query=value (protocol with query but no path)', t => {
  const result = parseURI('custom:?query=value')
  t.truthy(result)
  t.is(result.protocol, 'custom')
  t.is(result.query, 'query=value')
})

test('app:#section (protocol with fragment but no path)', t => {
  const result = parseURI('app:#section')
  t.truthy(result)
  t.is(result.protocol, 'app')
  t.is(result.anchor, 'section')
})

test('HTTP://EXAMPLE.COM/PATH (case sensitivity)', t => {
  const result = parseURI('HTTP://EXAMPLE.COM/PATH')
  t.truthy(result)
  t.is(result.protocol, 'HTTP')
  t.is(result.authority, 'EXAMPLE.COM')
})
