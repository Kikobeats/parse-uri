'use strict'

module.exports = (str, opts = {}) => {
  if (!str) return undefined

  // Single regex pattern - handles both strict and loose modes
  const pattern = opts.strictMode
    ? /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*)|([^?#]*?))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
    : /^(?:([^:/?#.]+):)?(?:\/\/([^/?#]*)|([^?#]*?))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/

  const matches = pattern.exec(str)
  if (!matches) return undefined

  const [
    ,
    protocol = '',
    authority = '',
    schemePart = '',
    path = '',
    query = '',
    anchor = ''
  ] = matches

  const actualPath = authority ? path : schemePart + path
  const pathname = authority
    ? actualPath.startsWith('/')
      ? actualPath
      : actualPath
        ? `/${actualPath}`
        : '/'
    : actualPath

  // Parse authority components
  const authMatch = authority
    ? /^(?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?/.exec(authority)
    : null
  const [
    ,
    userInfo = '',
    username = '',
    password = '',
    hostname = '',
    rawPort = ''
  ] = authMatch || []

  // Handle default ports and build components
  const port =
    (rawPort === '80' && protocol === 'http') ||
    (rawPort === '443' && protocol === 'https')
      ? ''
      : rawPort
  const host = port ? `${hostname}:${port}` : hostname
  const origin =
    protocol === 'http' || protocol === 'https' ? `${protocol}://${host}` : ''

  return {
    href: str,
    protocol: protocol ? `${protocol}:` : '',
    authority,
    search: query ? `?${query}` : '',
    hash: anchor ? `#${anchor}` : '',
    userInfo,
    username,
    password,
    host,
    hostname,
    port,
    pathname,
    searchParams: new URLSearchParams(query),
    origin
  }
}
