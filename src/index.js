'use strict'

module.exports = (str, opts = {}) => {
  if (!str) return undefined

  const queryParser = /(?:^|&)([^&=]*)=?([^&]*)/g
  const patterns = {
    // Captures: protocol, authority, path, query, fragment
    // Updated to handle schemes without '//' like mailto:, tel:, etc.
    strict:
      /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*)|([^?#]*?))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
    // Loose pattern updated to handle mailto and similar schemes
    loose:
      /^(?:([^:/?#.]+):)?(?:\/\/([^/?#]*)|([^?#]*?))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
  }

  const pattern = opts.strictMode ? patterns.strict : patterns.loose
  const matches = pattern.exec(str)
  if (!matches) return undefined

  // Destructure regex matches for clarity
  // Note: matches[2] is authority (with //), matches[3] is scheme-specific part (without //)
  const [
    ,
    protocol = '',
    authority = '',
    schemePart = '',
    relative = '',
    query = '',
    anchor = ''
  ] = matches

  // For schemes like mailto:, the email goes in schemePart, not authority
  const actualAuthority = authority || ''
  const actualRelative = authority ? relative : schemePart + relative

  // Initialize all URI components
  const uri = {
    source: str,
    protocol,
    authority: actualAuthority,
    relative: actualRelative,
    query,
    anchor,
    userInfo: '',
    user: '',
    password: '',
    host: '',
    port: '',
    path: actualRelative,
    directory: '',
    file: '',
    queryKey: {}
  }

  // Parse authority into user info, host, and port
  if (actualAuthority) {
    const authorityPattern =
      /^(?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?/
    const authorityMatches = authorityPattern.exec(actualAuthority)
    if (authorityMatches) {
      const [, userInfo = '', user = '', password = '', host = '', port = ''] =
        authorityMatches
      Object.assign(uri, { userInfo, user, password, host, port })
    }
  }

  // Parse the relative part into directory and file
  if (actualRelative) {
    const lastSlashIndex = actualRelative.lastIndexOf('/')
    if (lastSlashIndex > -1) {
      uri.directory = actualRelative.substring(0, lastSlashIndex + 1)
      uri.file = actualRelative.substring(lastSlashIndex + 1)
    } else {
      uri.file = actualRelative
    }
  }

  // Parse query parameters
  if (query) {
    for (const [, key, value] of query.matchAll(queryParser)) {
      if (key) uri.queryKey[key] = value
    }
  }

  return uri
}
