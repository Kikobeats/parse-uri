'use strict'

module.exports = (str, opts = {}) => {
  if (!str) return undefined

  const queryParser = /(?:^|&)([^&=]*)=?([^&]*)/g
  const patterns = {
    strict:
      /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
    loose:
      /^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?:\/\/)?([^/?#]*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
  }

  const pattern = opts.strictMode ? patterns.strict : patterns.loose
  const matches = pattern.exec(str)
  if (!matches) return undefined

  // Initialize all URI components
  const uri = {
    source: str,
    protocol: matches[1] || '',
    authority: matches[2] || '',
    relative: matches[3] || '',
    query: matches[4] || '',
    anchor: matches[5] || '',
    userInfo: '',
    user: '',
    password: '',
    host: '',
    port: '',
    path: '',
    directory: '',
    file: '',
    queryKey: {}
  }

  // Parse authority into user info, host, and port
  if (uri.authority) {
    const authorityPattern =
      /^(?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?/
    const authorityMatches = authorityPattern.exec(uri.authority)
    if (authorityMatches) {
      uri.userInfo = authorityMatches[1] || ''
      uri.user = authorityMatches[2] || ''
      uri.password = authorityMatches[3] || ''
      uri.host = authorityMatches[4] || ''
      uri.port = authorityMatches[5] || ''
    }
  }

  // Parse the relative part into path, directory, and file
  if (uri.relative) {
    uri.path = uri.relative

    const pathParts = uri.relative.split('/')
    if (pathParts.length > 1) {
      // Has directory structure
      uri.file = pathParts[pathParts.length - 1]
      uri.directory = pathParts.slice(0, -1).join('/') + '/'
    } else {
      // No directory structure, just a file
      uri.file = uri.relative
      uri.directory = ''
    }
  }

  // Parse query parameters
  uri.query.replace(queryParser, function (_, key, value) {
    if (key) uri.queryKey[key] = value
  })

  return uri
}
