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
  if (!matches) return undefined

  const uri = {}
  uri[o.key[0]] = str
  uri[o.key[1]] = matches[1] || ''
  uri[o.key[2]] = matches[2] || ''
  uri[o.key[8]] = matches[3] || ''
  uri[o.key[12]] = matches[4] || ''
  uri[o.key[13]] = matches[5] || ''

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

  uri[o.q.name] = {}
  uri[o.key[12]].replace(o.q.parser, function (_, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2
  })

  return uri
}
