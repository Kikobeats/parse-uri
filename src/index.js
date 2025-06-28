'use strict'

module.exports = (str, opts = {}) => {
  if (!str) return undefined

  const o = {
    key: [
      'source',
      'protocol',
      'authority',
      'userInfo',
      'user',
      'password',
      'host',
      'port',
      'relative',
      'path',
      'directory',
      'file',
      'query',
      'anchor'
    ],
    q: {
      name: 'queryKey',
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict:
        /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
      loose:
        /^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?:\/\/)?([^/?#]*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
    }
  }

  const pattern = opts.strictMode ? o.parser.strict : o.parser.loose
  const matches = pattern.exec(str)

  const uri = {}
  uri[o.key[0]] = str
  uri[o.key[1]] = matches[1] || ''
  uri[o.key[2]] = matches[2] || ''
  uri[o.key[8]] = matches[3] || ''
  uri[o.key[12]] = matches[4] || ''
  uri[o.key[13]] = matches[5] || ''

  // Initialize authority-related fields (always set them)
  uri[o.key[3]] = '' // userInfo
  uri[o.key[4]] = '' // user
  uri[o.key[5]] = '' // password
  uri[o.key[6]] = '' // host
  uri[o.key[7]] = '' // port

  // Further breakdown and parsing can be done here if needed
  // For example, splitting authority into userInfo, host, and port
  if (uri[o.key[2]]) {
    const authorityPattern =
      /^(?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?/
    const authorityMatches = authorityPattern.exec(uri[o.key[2]])
    if (authorityMatches) {
      uri[o.key[3]] = authorityMatches[1] || ''
      uri[o.key[4]] = authorityMatches[2] || ''
      uri[o.key[5]] = authorityMatches[3] || ''
      uri[o.key[6]] = authorityMatches[4] || ''
      uri[o.key[7]] = authorityMatches[5] || ''
    }
  }

  // Parse the relative part into path, directory, and file
  if (uri[o.key[8]]) {
    // path is the same as relative
    uri[o.key[9]] = uri[o.key[8]]

    // Split into directory and file
    const pathParts = uri[o.key[8]].split('/')
    if (pathParts.length > 1) {
      // Has directory structure
      uri[o.key[11]] = pathParts[pathParts.length - 1] // file is last part
      uri[o.key[10]] = pathParts.slice(0, -1).join('/') + '/' // directory is everything before last part + '/'
    } else {
      // No directory structure, just a file
      uri[o.key[11]] = uri[o.key[8]] // file is the whole relative part
      uri[o.key[10]] = '' // no directory
    }
  } else {
    // Set empty values for path, directory, and file when relative is empty
    uri[o.key[9]] = ''
    uri[o.key[10]] = ''
    uri[o.key[11]] = ''
  }

  uri[o.q.name] = {}
  uri[o.key[12]].replace(o.q.parser, function (_, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2
  })

  return uri
}
