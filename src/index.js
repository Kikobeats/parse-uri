'use strict'

module.exports = (str, opts = {}) => {
  if (!str) return undefined

  const queryParser = /(?:^|&)([^&=]*)=?([^&]*)/g
  const patterns = {
    // Captures: protocol, authority, path, query, fragment
    strict:
      /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
    // Loose pattern with negative lookahead to avoid user:pass@ patterns
    loose:
      /^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?:\/\/)?([^/?#]*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
  }

  const pattern = opts.strictMode ? patterns.strict : patterns.loose
  const matches = pattern.exec(str)
  if (!matches) return undefined

  // Destructure regex matches for clarity
  const [
    ,
    protocol = '',
    authority = '',
    relative = '',
    query = '',
    anchor = ''
  ] = matches

  // Initialize all URI components
  const uri = {
    source: str,
    protocol,
    authority,
    relative,
    query,
    anchor,
    userInfo: '',
    user: '',
    password: '',
    host: '',
    port: '',
    path: relative,
    directory: '',
    file: '',
    queryKey: {}
  }

  // Parse authority into user info, host, and port
  if (authority) {
    const authorityPattern =
      /^(?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?/
    const authorityMatches = authorityPattern.exec(authority)
    if (authorityMatches) {
      const [, userInfo = '', user = '', password = '', host = '', port = ''] =
        authorityMatches
      Object.assign(uri, { userInfo, user, password, host, port })
    }
  }

  // Parse the relative part into directory and file
  if (relative) {
    const lastSlashIndex = relative.lastIndexOf('/')
    if (lastSlashIndex > -1) {
      uri.directory = relative.substring(0, lastSlashIndex + 1)
      uri.file = relative.substring(lastSlashIndex + 1)
    } else {
      uri.file = relative
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
