const { parseJavascript } = require("./javascript");
const { parsePython } = require("./python");
const { parseJava } = require("./java");
const { parseFallbackImports, calculateFallbackComplexity } = require("./fallback");

const parseImports = (content, language) => {
  let result = null;

  if (language === "JavaScript" || language === "TypeScript") {
    result = parseJavascript(content);
  } else if (language === "Python") {
    result = parsePython(content);
  } else if (language === "Java") {
    result = parseJava(content);
  }

  // If AST parsing succeeded and returned imports, use them
  if (result && result.imports) {
    return result.imports;
  }

  // Fallback to regex
  return parseFallbackImports(content, language);
};

const calculateComplexity = (content, language) => {
  let result = null;

  if (language === "JavaScript" || language === "TypeScript") {
    result = parseJavascript(content);
  } else if (language === "Python") {
    result = parsePython(content);
  } else if (language === "Java") {
    result = parseJava(content);
  }

  // If AST parsing succeeded and returned complexity, use it
  if (result && result.complexity) {
    return result.complexity;
  }

  // Fallback to regex
  return calculateFallbackComplexity(content);
};

module.exports = {
  parseImports,
  calculateComplexity
};
