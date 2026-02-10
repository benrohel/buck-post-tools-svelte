#!/usr/bin/env node

/**
 * Script Order Checker
 *
 * Scans all .svelte files and identifies components that don't follow
 * the 14-section script ordering standard.
 *
 * Usage: node scripts/check-script-order.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Section markers we're looking for
const SECTION_MARKERS = [
  { order: 1, pattern: /from ['"]svelte['"]/, name: 'Svelte imports' },
  { order: 2, pattern: /from ['"]lucide-svelte['"]|from ['"]@svelte-plugins/, name: 'Third-party imports' },
  { order: 3, pattern: /from ['"]@\/components/, name: 'Component imports' },
  { order: 4, pattern: /from ['"]@\/stores/, name: 'Store imports' },
  { order: 5, pattern: /from ['"]@\/lib|from ['"]@\/api/, name: 'API/Utility imports' },
  { order: 6, pattern: /import ['"]\.\/.+\.scss['"]/, name: 'Stylesheet import' },
  { order: 7, pattern: /const log = logModule/, name: 'Logger setup' },
  { order: 8, pattern: /^  interface |^  type /, name: 'Type definitions' },
  { order: 9, pattern: /^  export let /, name: 'Props' },
  { order: 10, pattern: /getContext\(['"]/, name: 'Context' },
  { order: 11, pattern: /^  let .+ =/, name: 'Local state' },
  { order: 12, pattern: /^  \$:/, name: 'Reactive declarations' },
  { order: 13, pattern: /^  const .+ = \(/, name: 'Functions' },
  { order: 14, pattern: /  onMount\(/, name: 'Lifecycle hooks' },
];

// Anti-patterns to check
const ANTI_PATTERNS = [
  {
    pattern: /\$: .*log\.debug/,
    message: 'Reactive logging detected (causes infinite loops)',
    severity: 'ERROR'
  },
  {
    pattern: /function \w+\(/,
    message: 'Function declaration detected (use arrow functions)',
    severity: 'WARNING'
  },
  {
    pattern: /const \w+ = \$\w+Store\./,
    message: 'Module-level store access detected (use onMount)',
    severity: 'WARNING'
  },
];

/**
 * Extract script content from .svelte file
 */
function extractScriptContent(fileContent) {
  const scriptMatch = fileContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  return scriptMatch ? scriptMatch[1] : null;
}

/**
 * Find which sections exist and their line numbers
 */
function analyzeSections(scriptContent) {
  const lines = scriptContent.split('\n');
  const foundSections = [];

  lines.forEach((line, index) => {
    SECTION_MARKERS.forEach(marker => {
      if (marker.pattern.test(line)) {
        foundSections.push({
          order: marker.order,
          name: marker.name,
          line: index + 1,
          content: line.trim()
        });
      }
    });
  });

  return foundSections;
}

/**
 * Check for anti-patterns
 */
function checkAntiPatterns(scriptContent, filePath) {
  const lines = scriptContent.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    ANTI_PATTERNS.forEach(antiPattern => {
      if (antiPattern.pattern.test(line)) {
        issues.push({
          line: index + 1,
          severity: antiPattern.severity,
          message: antiPattern.message,
          content: line.trim()
        });
      }
    });
  });

  return issues;
}

/**
 * Check if sections are in correct order
 */
function checkSectionOrder(sections) {
  const violations = [];

  for (let i = 1; i < sections.length; i++) {
    const prev = sections[i - 1];
    const curr = sections[i];

    if (curr.order < prev.order) {
      violations.push({
        message: `"${curr.name}" (line ${curr.line}) should come before "${prev.name}" (line ${prev.line})`,
        severity: 'ORDER'
      });
    }
  }

  return violations;
}

/**
 * Analyze a single file
 */
function analyzeFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const scriptContent = extractScriptContent(fileContent);

  if (!scriptContent) {
    return null; // No script section
  }

  const sections = analyzeSections(scriptContent);
  const orderViolations = checkSectionOrder(sections);
  const antiPatterns = checkAntiPatterns(scriptContent, filePath);

  if (orderViolations.length === 0 && antiPatterns.length === 0) {
    return null; // All good!
  }

  return {
    filePath,
    sections,
    orderViolations,
    antiPatterns
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning Svelte components for script order violations...\n');

  const files = glob.sync('src/js/**/*.svelte', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });

  const results = [];

  for (const file of files) {
    const result = analyzeFile(file);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.log('✅ All components follow the script ordering standard!\n');
    return;
  }

  console.log(`❌ Found ${results.length} component(s) with issues:\n`);

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.filePath}`);
    console.log('   Sections found:', result.sections.map(s => `${s.name} (L${s.line})`).join(', '));

    if (result.orderViolations.length > 0) {
      console.log('\n   📋 Section Order Issues:');
      result.orderViolations.forEach(violation => {
        console.log(`      - ${violation.message}`);
      });
    }

    if (result.antiPatterns.length > 0) {
      console.log('\n   ⚠️  Anti-patterns:');
      result.antiPatterns.forEach(issue => {
        console.log(`      - [${issue.severity}] Line ${issue.line}: ${issue.message}`);
        console.log(`        ${issue.content}`);
      });
    }

    console.log('');
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total files scanned: ${files.length}`);
  console.log(`   Files with issues: ${results.length}`);
  console.log(`   Compliance rate: ${((files.length - results.length) / files.length * 100).toFixed(1)}%\n`);

  console.log('📖 See docs/SCRIPT_ORDER_STANDARD.md for the complete standard\n');

  process.exit(results.length > 0 ? 1 : 0);
}

main().catch(console.error);
