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

  // Force garbage collection before starting if available
  if (global.gc) {
    global.gc()
  }

  // More reliable memory measurement: run multiple samples and take average
  const sampleCount = 5
  let localTotalMemory = 0
  let npmTotalMemory = 0

  for (let sample = 0; sample < sampleCount; sample++) {
    // Test local implementation
    const localResults = []
    const localMemBefore = process.memoryUsage().heapUsed

    for (let i = 0; i < iterations / sampleCount; i++) {
      localResults.push(parseUriLocal(testUrls.complex))
    }

    const localMemAfter = process.memoryUsage().heapUsed
    const localMemDiff = Math.max(0, localMemAfter - localMemBefore) // Ensure non-negative
    localTotalMemory += localMemDiff

    // Force garbage collection between tests if available
    if (global.gc) {
      global.gc()
    }

    // Test npm implementation
    const npmResults = []
    const npmMemBefore = process.memoryUsage().heapUsed

    for (let i = 0; i < iterations / sampleCount; i++) {
      npmResults.push(parseUriNpm(testUrls.complex))
    }

    const npmMemAfter = process.memoryUsage().heapUsed
    const npmMemDiff = Math.max(0, npmMemAfter - npmMemBefore) // Ensure non-negative
    npmTotalMemory += npmMemDiff

    // Force garbage collection after each sample
    if (global.gc) {
      global.gc()
    }
  }

  // Calculate averages
  const localMemDiff = localTotalMemory / sampleCount
  const npmMemDiff = npmTotalMemory / sampleCount

  console.log(`parse-uri: ${(localMemDiff / 1024 / 1024).toFixed(2)} MB (avg)`)
  console.log(`parseuri:  ${(npmMemDiff / 1024 / 1024).toFixed(2)} MB (avg)`)

  const memWinner = localMemDiff < npmMemDiff ? 'parse-uri' : 'parseuri'
  const memSavings = Math.abs(localMemDiff - npmMemDiff) / 1024 / 1024

  if (memSavings < 0.01) {
    console.log('Memory usage is essentially equivalent\n')
  } else {
    console.log(
      `Winner: ${memWinner} (${memSavings.toFixed(2)} MB less memory used)\n`
    )
  }

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

    // Generate complete README content
    const readmeContent = generateCompleteReadme(
      performanceTable,
      memoryTable,
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
  const { localMemDiff, npmMemDiff, memWinner, memSavings } = memoryResults

  const localMB = (localMemDiff / 1024 / 1024).toFixed(2)
  const npmMB = (npmMemDiff / 1024 / 1024).toFixed(2)

  // Handle very small differences
  const isEquivalent = memSavings < 0.01

  return `| Implementation | Memory Usage (avg) | Result |
|----------------|-------------------:|--------|
| parse-uri | ${localMB} MB | ${
    isEquivalent
      ? '✅ Equivalent'
      : memWinner === 'parse-uri'
        ? '✅ **Winner**'
        : ''
  } |
| parseuri | ${npmMB} MB | ${
    isEquivalent
      ? '✅ Equivalent'
      : memWinner === 'parseuri'
        ? '✅ **Winner**'
        : `${memSavings.toFixed(2)} MB more`
  } |`
}

function generateCompleteReadme (performanceTable, memoryTable, memoryResults) {
  const { memWinner, memSavings } = memoryResults
  const currentDate = new Date().toISOString().split('T')[0]

  return `# Parse URI Benchmark Results

> Generated on ${currentDate}.
> This benchmark report is automatically generated by running \`node benchmark/index.js\`.

## Overview

This benchmark compares **parse-uri** (spec-compliant implementation) with **parseuri** (popular npm package).

### Key Differences

- **parse-uri**: Full WHATWG URL Standard compliance with modern field names
- **parseuri**: Legacy implementation with older conventions

## Performance Comparison

${performanceTable}

## Memory Usage

${memoryTable}

${
  memSavings < 0.01
    ? '*Memory usage is essentially equivalent*'
    : `*Winner: ${memWinner} saves ${memSavings.toFixed(2)} MB*`
}

`
}

console.log('🚀 Starting performance benchmarks...\n')

// Run the benchmark
suite.run({ async: true })
