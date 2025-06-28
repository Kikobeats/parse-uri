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
    t.is(result.pathname, '/') // Spec compliant: authority URLs always have '/' pathname
  })
})

test('path without directory structure', t => {
  // Test URLs/paths that have a relative path but no directory separators
  const testCases = ['filename.txt', 'document', 'index.html']

  testCases.forEach(url => {
    const result = parseURI(url, { strictMode: true })
    t.truthy(result)
    t.is(result.pathname, url)
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
  t.is(result.protocol, 'mailto:')
  t.is(result.authority, '')
  t.is(result.pathname, 'john@example.com')
  t.is(result.search, '')
  t.true(result.searchParams instanceof URLSearchParams)
  t.is(result.searchParams.toString(), '')
})

test('mailto:test@domain.com?subject=Hello&body=World', t => {
  const result = parseURI('mailto:test@domain.com?subject=Hello&body=World')
  t.truthy(result)
  t.is(result.protocol, 'mailto:')
  t.is(result.authority, '')
  t.is(result.pathname, 'test@domain.com')
  t.is(result.search, '?subject=Hello&body=World')
  t.true(result.searchParams instanceof URLSearchParams)
  t.is(result.searchParams.get('subject'), 'Hello')
  t.is(result.searchParams.get('body'), 'World')
  t.is(result.searchParams.toString(), 'subject=Hello&body=World')
})

test('tel:+1-555-123-4567', t => {
  const result = parseURI('tel:+1-555-123-4567')
  t.truthy(result)
  t.is(result.protocol, 'tel:')
  t.is(result.pathname, '+1-555-123-4567')
})

test('tel:555-1234', t => {
  const result = parseURI('tel:555-1234')
  t.truthy(result)
  t.is(result.protocol, 'tel:')
  t.is(result.pathname, '555-1234')
})

test('ftp://ftp.example.com/path/file.txt', t => {
  const result = parseURI('ftp://ftp.example.com/path/file.txt')
  t.truthy(result)
  t.is(result.protocol, 'ftp:')
  t.is(result.authority, 'ftp.example.com')
  t.is(result.pathname, '/path/file.txt')
  t.is(result.host, 'ftp.example.com')
  t.is(result.hostname, 'ftp.example.com')
})

test('ftp://user:pass@ftp.example.com:21/dir/', t => {
  const result = parseURI('ftp://user:pass@ftp.example.com:21/dir/')
  t.truthy(result)
  t.is(result.protocol, 'ftp:')
  t.is(result.authority, 'user:pass@ftp.example.com:21')
  t.is(result.host, 'ftp.example.com:21')
  t.is(result.hostname, 'ftp.example.com')
  t.is(result.port, '21')
  t.is(result.username, 'user')
  t.is(result.password, 'pass')
})

test('file:///path/to/file.txt', t => {
  const result = parseURI('file:///path/to/file.txt')
  t.truthy(result)
  t.is(result.protocol, 'file:')
  t.is(result.authority, '')
  t.is(result.pathname, '/path/to/file.txt')
})

test('file://localhost/path/to/file.txt', t => {
  const result = parseURI('file://localhost/path/to/file.txt')
  t.truthy(result)
  t.is(result.protocol, 'file:')
  t.is(result.authority, 'localhost')
  t.is(result.pathname, '/path/to/file.txt')
  t.is(result.host, 'localhost')
  t.is(result.hostname, 'localhost')
})

test('data:text/plain;base64,SGVsbG8gV29ybGQ=', t => {
  const result = parseURI('data:text/plain;base64,SGVsbG8gV29ybGQ=')
  t.truthy(result)
  t.is(result.protocol, 'data:')
  t.is(result.pathname, 'text/plain;base64,SGVsbG8gV29ybGQ=')
})

test('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', t => {
  const result = parseURI('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...')
  t.truthy(result)
  t.is(result.protocol, 'data:')
  t.is(result.pathname, 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...')
})

test('javascript:alert("Hello World")', t => {
  const result = parseURI('javascript:alert("Hello World")')
  t.truthy(result)
  t.is(result.protocol, 'javascript:')
  t.is(result.pathname, 'alert("Hello World")')
})

test('myapp://action/path?param=value', t => {
  const result = parseURI('myapp://action/path?param=value')
  t.truthy(result)
  t.is(result.protocol, 'myapp:')
  t.is(result.authority, 'action')
  t.is(result.pathname, '/path')
  t.is(result.search, '?param=value')
  t.true(result.searchParams instanceof URLSearchParams)
  t.is(result.searchParams.get('param'), 'value')
})

test('steam://rungameid/12345', t => {
  const result = parseURI('steam://rungameid/12345')
  t.truthy(result)
  t.is(result.protocol, 'steam:')
  t.is(result.authority, 'rungameid')
  t.is(result.pathname, '/12345')
})

test('http2://example.com/path', t => {
  const result = parseURI('http2://example.com/path')
  t.truthy(result)
  t.is(result.protocol, 'http2:')
  t.is(result.authority, 'example.com')
  t.is(result.pathname, '/path')
})

test('mailto: (empty protocol content)', t => {
  const result = parseURI('mailto:')
  t.truthy(result)
  t.is(result.protocol, 'mailto:')
  t.is(result.pathname, '')
})

test('verylongprotocolname://example.com', t => {
  const result = parseURI('verylongprotocolname://example.com')
  t.truthy(result)
  t.is(result.protocol, 'verylongprotocolname:')
  t.is(result.authority, 'example.com')
})

test('custom:?query=value (protocol with query but no path)', t => {
  const result = parseURI('custom:?query=value')
  t.truthy(result)
  t.is(result.protocol, 'custom:')
  t.is(result.search, '?query=value')
})

test('app:#section (protocol with fragment but no path)', t => {
  const result = parseURI('app:#section')
  t.truthy(result)
  t.is(result.protocol, 'app:')
  t.is(result.hash, '#section')
})

test('HTTP://EXAMPLE.COM/PATH (case sensitivity)', t => {
  const result = parseURI('HTTP://EXAMPLE.COM/PATH')
  t.truthy(result)
  t.is(result.protocol, 'HTTP:')
  t.is(result.authority, 'EXAMPLE.COM')
  t.is(result.hostname, 'EXAMPLE.COM')
  t.is(result.host, 'EXAMPLE.COM')
})

test('spec compliance - href and origin fields', t => {
  const result = parseURI(
    'https://user:pass@example.com:8080/path?query=value#hash'
  )
  t.truthy(result)
  t.is(result.href, 'https://user:pass@example.com:8080/path?query=value#hash')
  t.is(result.origin, 'https://example.com:8080')
  t.is(result.search, '?query=value')
  t.is(result.hash, '#hash')
  t.is(result.pathname, '/path')
})

test('spec compliance - default ports omitted', t => {
  const httpsResult = parseURI('https://example.com:443/path')
  const httpResult = parseURI('http://example.com:80/path')

  t.is(httpsResult.port, '')
  t.is(httpsResult.host, 'example.com')
  t.is(httpsResult.origin, 'https://example.com')

  t.is(httpResult.port, '')
  t.is(httpResult.host, 'example.com')
  t.is(httpResult.origin, 'http://example.com')
})

test('spec compliance - pathname always starts with / for authority URLs', t => {
  const result = parseURI('https://example.com')
  t.is(result.pathname, '/')
  t.is(result.origin, 'https://example.com')
})

test('spec compliance - searchParams is URLSearchParams instance', t => {
  const result = parseURI(
    'https://example.com/path?foo=bar&baz=qux&foo=another'
  )
  t.true(result.searchParams instanceof URLSearchParams)
  t.is(result.searchParams.get('foo'), 'bar') // Gets first value
  t.is(result.searchParams.get('baz'), 'qux')
  t.deepEqual(result.searchParams.getAll('foo'), ['bar', 'another']) // Gets all values
  t.is(result.searchParams.toString(), 'foo=bar&baz=qux&foo=another')
  t.is(result.search, '?foo=bar&baz=qux&foo=another')
})
