// fallback.js - Improved regex parsers for languages lacking AST

// Strip out comments and string literals to reduce false positives
const stripStringsAndComments = (content) => {
  return content
    // Replace string literals (single, double, backticks)
    .replace(/(["'`])(?:(?=(\\?))\2.)*?\1/gs, '')
    // Replace block comments /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Replace single line comments // ...
    .replace(/\/\/.*$/gm, '')
    // Replace Python/Ruby style # comments
    .replace(/#.*$/gm, '');
};

const parseFallbackImports = (content, language) => {
  const imports = [];
  
  if (language === "Go") {
    // Single import: import "fmt"
    const singleMatches = content.matchAll(/^import\s+["']([^"']+)["']/gm);
    for (const m of singleMatches) imports.push(m[1]);
    
    // Block import: import ( ... )
    const blockMatch = content.match(/import\s*\(\s*([\s\S]*?)\s*\)/);
    if (blockMatch) {
      const paths = blockMatch[1].matchAll(/["']([^"']+)["']/g);
      for (const m of paths) imports.push(m[1]);
    }
  } else if (language === "Java" || language === "Kotlin") {
    const javaMatches = content.matchAll(/^import\s+([\w.]+);?/gm);
    for (const m of javaMatches) imports.push(m[1]);
  } else if (language === "Ruby") {
    const rbMatches = content.matchAll(/^(?:require|require_relative)\s+['"]([^'"]+)['"]/gm);
    for (const m of rbMatches) imports.push(m[1]);
  } else if (language === "Rust") {
    const rsMatches = content.matchAll(/^use\s+([^;]+);/gm);
    for (const m of rsMatches) {
        // Simple heuristic for use path::to::module
        const cleaned = m[1].replace(/[{}]/g, '').split('::')[0].trim();
        if (cleaned) imports.push(cleaned);
    }
  }

  return [...new Set(imports)];
};

const calculateFallbackComplexity = (content) => {
  // Strip out comments and strings to ensure we only count actual code decision points
  const cleanContent = stripStringsAndComments(content);
  
  let complexity = 1;
  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bswitch\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /&&/g,
    /\|\|/g,
    /\?[^:]/g, // ternary operator
  ];

  for (const pattern of patterns) {
    const matches = cleanContent.match(pattern);
    if (matches) complexity += matches.length;
  }
  return complexity;
};

module.exports = {
  parseFallbackImports,
  calculateFallbackComplexity
};
