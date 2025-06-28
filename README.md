# parse-uri

![Last version](https://img.shields.io/github/tag/Kikobeats/parse-uri.svg?style=flat-square)
[![Coverage Status](https://img.shields.io/coveralls/Kikobeats/parse-uri.svg?style=flat-square)](https://coveralls.io/github/Kikobeats/parse-uri)
[![NPM Status](http://img.shields.io/npm/dm/parse-uri.svg?style=flat-square)](https://www.npmjs.org/package/parse-uri)

> Lightweight module for parsing an URI Based in [Steven Levithan](http://blog.stevenlevithan.com/archives/parseuri) method.

## Install

```bash
$ npm install parse-uri --save
```

## Usage

```js
const parseUri = require('parse-uri')

parseUri('myURL')
```

## API

### parseURI(str, [options])

#### options

##### strictMode

Type: `boolean`
Default: `false`

Determinate if use `loose` or `strict` mode.

> Loose mode deviates slightly from the official generic URI spec ([RFC 3986](http://tools.ietf.org/html/rfc3986))

### Benchmark

Compared vs `parseuri`:

```
============================================================
simple          | parse-uri is 3302.0% faster
basic           | parse-uri is 1370.8% faster
complex         | parse-uri is 967.7% faster
mailto          | parse-uri is 1493.3% faster
tel             | parse-uri is 3296.8% faster
ftp             | parse-uri is 1641.9% faster
file            | parse-uri is 3305.7% faster
data            | parse-uri is 3030.4% faster
javascript      | parse-uri is 2992.0% faster
custom          | parse-uri is 1196.0% faster
longUrl         | parse-uri is 547.1% faster
unicodeUrl      | parse-uri is 1005.6% faster
============================================================

🏆 Overall Winner: parse-uri (2058.1% faster on average)
```

See more numbers at [benchmark](/benchmark/README.md).

### Related

- [is-uri](https://github.com/Kikobeats/is-uri#is-uri) – Determinate if a string is a valid URI.

## License

MIT © [Kiko Beats](http://kikobeats.com)
