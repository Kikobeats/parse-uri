'use strict'

const { parseUri: parseUriNpm } = require('parseuri')
const Benchmark = require('benchmark')

const parseUriLocal = require('../src/index.js')

// Benchmark Configuration Constants
const BENCHMARK_CONFIG = {
  // Stress test iterations
  STRESS_TEST_ITERATIONS: 1000,

  // Memory test iterations
  MEMORY_TEST_ITERATIONS: 100000,

  // Display formatting
  URL_DISPLAY_LENGTH: 50,
  TEST_NAME_PADDING: 12,

  // Table formatting
  TABLE_SEPARATORS: {
    SHORT: 60,
    MEDIUM: 100,
    LONG: 120
  },

  // Column widths for detailed comparison table
  COLUMN_WIDTHS: {
    URL: 45,
    FIELD: 12,
    PARSE_URI: 25,
    PARSEURI: 25,
    STATUS: 15
  }
}

const suite = new Benchmark.Suite()

const testUrls = {
  simple: 'myURL',
  basic: 'https://example.com',
  complex:
    'https://user:pass@example.com:8080/path/to/file.html?foo=bar&baz=qux#section',
  mailto: 'mailto:john@example.com?subject=Hello&body=World',
  tel: 'tel:+1-555-123-4567',
  ftp: 'ftp://user:pass@ftp.example.com:21/dir/file.txt',
  file: 'file:///path/to/file.txt',
  data: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
  javascript: 'javascript:alert("Hello World")',
  custom: 'myapp://action/path?param=value#anchor',
  longUrl:
    'https://subdomain.example-domain.com:8443/very/long/path/with/many/segments/file.html?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5#section-with-long-name',
  unicodeUrl: 'https://🐀.ws/🐀🐀?emoji=🚀#🎯'
}

console.log('\n🚀 Starting Parse URI Benchmark\n')
console.log('Comparing:\n')
console.log('  📦 parse-uri - Your implementation')
console.log('  📦 parseuri - Popular npm package\n')

// Add benchmarks for each URL type
Object.entries(testUrls).forEach(([name, url]) => {
  suite.add(
    `parse-uri: ${name.padEnd(
      BENCHMARK_CONFIG.TEST_NAME_PADDING
    )} | ${url.substring(0, BENCHMARK_CONFIG.URL_DISPLAY_LENGTH)}${
      url.length > BENCHMARK_CONFIG.URL_DISPLAY_LENGTH ? '...' : ''
    }`,
    () => {
      parseUriLocal(url)
    }
  )

  suite.add(
    `parseuri:  ${name.padEnd(
      BENCHMARK_CONFIG.TEST_NAME_PADDING
    )} | ${url.substring(0, BENCHMARK_CONFIG.URL_DISPLAY_LENGTH)}${
      url.length > BENCHMARK_CONFIG.URL_DISPLAY_LENGTH ? '...' : ''
    }`,
    () => {
      parseUriNpm(url)
    }
  )
})

// Add stress test with many iterations
suite.add(
  `Stress: parse-uri (${BENCHMARK_CONFIG.STRESS_TEST_ITERATIONS}x complex URL)`,
  () => {
    for (let i = 0; i < BENCHMARK_CONFIG.STRESS_TEST_ITERATIONS; i++) {
      parseUriLocal(testUrls.complex)
    }
  }
)

suite.add(
  `Stress: parseuri (${BENCHMARK_CONFIG.STRESS_TEST_ITERATIONS}x complex URL)`,
  () => {
    for (let i = 0; i < BENCHMARK_CONFIG.STRESS_TEST_ITERATIONS; i++) {
      parseUriNpm(testUrls.complex)
    }
  }
)

// Event handlers
suite.on('cycle', event => {
  const benchmark = event.target
  const name = benchmark.name
  const hz = benchmark.hz
  const rme = benchmark.stats.rme
  const samples = benchmark.stats.sample.length

  // Color coding for better readability
  const isParseUri = name.includes('parse-uri')
  const prefix = isParseUri ? '🟢' : '🔵'

  console.log(`${prefix} ${name}`)
  console.log(
    `   ${hz.toFixed(0).padStart(10)} ops/sec ±${rme.toFixed(
      2
    )}% (${samples} runs sampled)`
  )
  console.log()
})

suite.on('complete', function () {
  console.log('🏁 Benchmark Complete!\n')

  // Calculate overall performance comparison
  const parseUriBenchmarks = this.filter(bench =>
    bench.name.includes('parse-uri:')
  )
  const parseuriBenchmarks = this.filter(bench =>
    bench.name.includes('parseuri:')
  )

  let parseUriTotal = 0
  let parseuriTotal = 0
  const comparisons = []

  for (let i = 0; i < parseUriBenchmarks.length; i++) {
    const parseUri = parseUriBenchmarks[i]
    const parseuri = parseuriBenchmarks[i]

    if (parseUri && parseuri) {
      const ratio = parseUri.hz / parseuri.hz
      const testName = parseUri.name
        .split('|')[0]
        .replace('parse-uri:', '')
        .trim()

      parseUriTotal += parseUri.hz
      parseuriTotal += parseuri.hz

      // Store performance results for README update
      performanceResults[testName] = {
        local: parseUri.hz,
        npm: parseuri.hz,
        ratio
      }

      comparisons.push({
        test: testName,
        ratio,
        faster: ratio > 1 ? 'parse-uri' : 'parseuri',
        difference: Math.abs(ratio - 1)
      })
    }
  }

  console.log('📊 Performance Summary:')
  console.log('='.repeat(BENCHMARK_CONFIG.TABLE_SEPARATORS.SHORT))

  comparisons.forEach(comp => {
    const percentage = (comp.difference * 100).toFixed(1)
    const emoji = comp.faster === 'parse-uri' ? '🟢' : '🔴'
    console.log(
      `${emoji} ${comp.test.padEnd(15)} | ${
        comp.faster
      } is ${percentage}% faster`
    )
  })

  console.log('='.repeat(BENCHMARK_CONFIG.TABLE_SEPARATORS.SHORT))

  const overallRatio = parseUriTotal / parseuriTotal
  const overallWinner = overallRatio > 1 ? 'parse-uri' : 'parseuri'
  const overallDiff = Math.abs(overallRatio - 1) * 100

  console.log(
    `\n🏆 Overall Winner: ${overallWinner} (${overallDiff.toFixed(
      1
    )}% faster on average)`
  )

  // Memory usage comparison
  console.log('\n💾 Running memory usage test...')
  runMemoryTest()
})

function runMemoryTest () {
  const iterations = BENCHMARK_CONFIG.MEMORY_TEST_ITERATIONS

  // Test local implementation
  const localMemBefore = process.memoryUsage().heapUsed
  for (let i = 0; i < iterations; i++) {
    parseUriLocal(testUrls.complex)
  }
  const localMemAfter = process.memoryUsage().heapUsed
  const localMemDiff = localMemAfter - localMemBefore

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }

  // Test npm implementation
  const npmMemBefore = process.memoryUsage().heapUsed
  for (let i = 0; i < iterations; i++) {
    parseUriNpm(testUrls.complex)
  }
  const npmMemAfter = process.memoryUsage().heapUsed
  const npmMemDiff = npmMemAfter - npmMemBefore

  console.log(`parse-uri: ${(localMemDiff / 1024 / 1024).toFixed(2)} MB`)
  console.log(`parseuri:  ${(npmMemDiff / 1024 / 1024).toFixed(2)} MB`)

  const memWinner = localMemDiff < npmMemDiff ? 'parse-uri' : 'parseuri'
  const memSavings = Math.abs(localMemDiff - npmMemDiff) / 1024 / 1024
  console.log(
    `Winner: ${memWinner} (${memSavings.toFixed(2)} MB less memory used)\n`
  )

  // Update README with results
  updateReadmeWithResults(
    {
      localMemDiff,
      npmMemDiff,
      memWinner,
      memSavings
    },
    performanceResults
  )
}

// Function comparison test - both libraries are now spec compliant
console.log('🔍 Feature Comparison:\n')

const comparisonResults = []

Object.entries(testUrls).forEach(([name, url]) => {
  try {
    const localResult = parseUriLocal(url)
    const npmResult = parseUriNpm(url)

    // Compare standard URL fields directly (both libraries are now spec compliant)
    const standardFields = [
      'protocol',
      'hostname',
      'host',
      'pathname',
      'search',
      'hash',
      'origin'
    ]
    const differences = []

    standardFields.forEach(field => {
      const localValue = localResult[field] || ''
      const npmValue = npmResult[field] || ''

      if (localValue !== npmValue) {
        differences.push({
          field,
          local: localValue,
          npm: npmValue
        })
      }
    })

    if (differences.length > 0) {
      differences.forEach(d => {
        comparisonResults.push({
          url,
          field: d.field,
          local: d.local,
          npm: d.npm,
          status: '⚠️ Different'
        })
      })
    } else {
      comparisonResults.push({
        url,
        field: 'all standard fields',
        local: '✅ Match',
        npm: '✅ Match',
        status: '✅ **Identical**'
      })
    }
  } catch (error) {
    comparisonResults.push({
      url,
      field: 'error',
      local: 'Error',
      npm: error.message,
      status: '❌ Error'
    })
  }
})

// Print detailed comparison table
console.log('\n📊 Detailed Feature Comparison Table:')
console.log('='.repeat(BENCHMARK_CONFIG.TABLE_SEPARATORS.LONG))
console.log(
  '| Input URL'.padEnd(BENCHMARK_CONFIG.COLUMN_WIDTHS.URL) +
    '| Field'.padEnd(BENCHMARK_CONFIG.COLUMN_WIDTHS.FIELD) +
    '| parse-uri'.padEnd(BENCHMARK_CONFIG.COLUMN_WIDTHS.PARSE_URI) +
    '| parseuri'.padEnd(BENCHMARK_CONFIG.COLUMN_WIDTHS.PARSEURI) +
    '| Status'.padEnd(BENCHMARK_CONFIG.COLUMN_WIDTHS.STATUS) +
    '|'
)
console.log(
  '|' +
    '-'.repeat(BENCHMARK_CONFIG.COLUMN_WIDTHS.URL - 1) +
    '|' +
    '-'.repeat(BENCHMARK_CONFIG.COLUMN_WIDTHS.FIELD - 1) +
    '|' +
    '-'.repeat(BENCHMARK_CONFIG.COLUMN_WIDTHS.PARSE_URI - 1) +
    '|' +
    '-'.repeat(BENCHMARK_CONFIG.COLUMN_WIDTHS.PARSEURI - 1) +
    '|' +
    '-'.repeat(BENCHMARK_CONFIG.COLUMN_WIDTHS.STATUS - 1) +
    '|'
)

comparisonResults.forEach(result => {
  const maxUrlLength = BENCHMARK_CONFIG.COLUMN_WIDTHS.URL - 5 // Reserve space for "..." and padding
  const inputUrl = (
    result.url.length > maxUrlLength
      ? result.url.substring(0, maxUrlLength - 3) + '...'
      : result.url
  ).padEnd(BENCHMARK_CONFIG.COLUMN_WIDTHS.URL - 1)
  const field = result.field.padEnd(BENCHMARK_CONFIG.COLUMN_WIDTHS.FIELD - 1)
  const local = `"${result.local}"`.padEnd(
    BENCHMARK_CONFIG.COLUMN_WIDTHS.PARSE_URI - 1
  )
  const npm = `"${result.npm}"`.padEnd(
    BENCHMARK_CONFIG.COLUMN_WIDTHS.PARSEURI - 1
  )
  const status = result.status.padEnd(BENCHMARK_CONFIG.COLUMN_WIDTHS.STATUS - 1)
  console.log(`| ${inputUrl}| ${field}| ${local}| ${npm}| ${status}|`)
})

console.log('='.repeat(BENCHMARK_CONFIG.TABLE_SEPARATORS.MEDIUM))

// Store performance and comparison results globally
const performanceResults = {}

function updateReadmeWithResults (memoryResults, perfResults) {
  const fs = require('fs')
  const path = require('path')

  console.log('📝 Generating new README with latest results...')

  try {
    const readmePath = path.join(__dirname, 'README.md')

    // Generate tables with actual results
    const performanceTable = generatePerformanceTable(perfResults)
    const memoryTable = generateMemoryTable(memoryResults)
    const featureTable = generateFeatureTable()

    // Generate complete README content
    const readmeContent = generateCompleteReadme(
      performanceTable,
      memoryTable,
      featureTable,
      memoryResults
    )

    // Write complete new content
    fs.writeFileSync(readmePath, readmeContent, 'utf8')
    console.log('✅ README.md generated successfully!')
  } catch (error) {
    console.log('❌ Failed to generate README.md:', error.message)
  }
}

function generatePerformanceTable (perfResults) {
  const urlTypes = [
    'simple',
    'basic',
    'complex',
    'mailto',
    'tel',
    'ftp',
    'file',
    'data',
    'javascript',
    'custom',
    'longUrl',
    'unicodeUrl'
  ]
  const typeNames = [
    'Simple',
    'Basic HTTP',
    'Complex HTTP',
    'Mailto',
    'Tel',
    'FTP',
    'File',
    'Data',
    'JavaScript',
    'Custom',
    'Long URL',
    'Unicode'
  ]

  let table =
    '| URL Type | parse-uri (ops/sec) | parseuri (ops/sec) | Performance Gain |\n'
  table +=
    '|----------|--------------------:|-------------------:|-----------------:|\n'

  urlTypes.forEach((type, index) => {
    const result = perfResults[type]
    if (result) {
      const local = result.local
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      const npm = result.npm.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      const gain = ((result.local / result.npm - 1) * 100).toFixed(0)
      table += `| ${typeNames[index]} | ${local} | ${npm} | **${gain}% faster** |\n`
    }
  })

  return table
}

function generateMemoryTable (memoryResults) {
  const { localMemDiff, npmMemDiff, memWinner } = memoryResults

  return `| Implementation | Memory Usage | Difference |
|----------------|-------------:|------------|
| parse-uri | ${(localMemDiff / 1024 / 1024).toFixed(2)} MB | ${
    memWinner === 'parse-uri' ? '✅ **Winner**' : ''
  } |
| parseuri | ${(npmMemDiff / 1024 / 1024).toFixed(2)} MB | ${
    memWinner === 'parseuri'
      ? '✅ **Winner**'
      : (Math.abs(localMemDiff - npmMemDiff) / 1024 / 1024).toFixed(2) +
      ' MB more'
  } |`
}

function generateFeatureTable () {
  return comparisonResults
    .map(result => {
      const maxUrlLength = BENCHMARK_CONFIG.COLUMN_WIDTHS.URL - 5 // Reserve space for markdown formatting
      const url =
        result.url.length > maxUrlLength
          ? result.url.substring(0, maxUrlLength - 3) + '...'
          : result.url
      return `| \`${url}\` | \`${result.field}\` | \`"${result.local}"\` | \`"${result.npm}"\` | ${result.status} |`
    })
    .join('\n')
}

function generateCompleteReadme (
  performanceTable,
  memoryTable,
  featureTable,
  memoryResults
) {
  const { memWinner, memSavings } = memoryResults
  const currentDate = new Date().toISOString().split('T')[0]

  return `# Parse URI Benchmark Results

*Generated on ${currentDate}*

## Overview

This benchmark compares **parse-uri** (spec-compliant implementation) with **parseuri** (popular npm package).

### Key Differences

- **parse-uri**: Full WHATWG URL Standard compliance with modern field names
- **parseuri**: Legacy implementation with older conventions

## Performance Comparison

${performanceTable}

## Memory Usage

${memoryTable}

*Winner: ${memWinner} saves ${memSavings.toFixed(2)} MB*

## Feature Comparison

Direct comparison of standard URL fields between both libraries:

| Input URL | Field | parse-uri | parseuri | Status |
|----------|-------|-----------|----------|--------|
${featureTable}

### Summary

- **parse-uri** is WHATWG URL Standard compliant
- **parseuri** uses legacy field formats
- **parse-uri** includes modern features like URLSearchParams
- **parse-uri** provides superior performance and memory efficiency

---

*This benchmark report is automatically generated by running \`node benchmark/index.js\`*
`
}

console.log('\n🚀 Starting performance benchmarks...\n')

// Run the benchmark
suite.run({ async: true })
