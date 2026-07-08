const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const parseJavascript = (content) => {
  const imports = [];
  let complexity = 1;

  try {
    const ast = parser.parse(content, {
      sourceType: "unambiguous", // Handles both script and module
      plugins: [
        "jsx",
        "typescript",
        "decorators-legacy",
        "classProperties",
        "dynamicImport"
      ],
      errorRecovery: true, // Don't throw on syntax errors if possible
    });

    traverse(ast, {
      // Extract imports
      ImportDeclaration(path) {
        if (path.node.source && path.node.source.value) {
          imports.push(path.node.source.value);
        }
      },
      CallExpression(path) {
        // Handle require('...') and dynamic import('...')
        const callee = path.node.callee;
        if (
          (callee.type === "Identifier" && callee.name === "require") ||
          callee.type === "Import"
        ) {
          const arg = path.node.arguments[0];
          if (arg && arg.type === "StringLiteral") {
            imports.push(arg.value);
          }
        }
      },
      ExportNamedDeclaration(path) {
        // export ... from '...'
        if (path.node.source && path.node.source.value) {
          imports.push(path.node.source.value);
        }
      },
      ExportAllDeclaration(path) {
        // export * from '...'
        if (path.node.source && path.node.source.value) {
          imports.push(path.node.source.value);
        }
      },

      // Calculate Complexity
      IfStatement() { complexity++; },
      ForStatement() { complexity++; },
      ForInStatement() { complexity++; },
      ForOfStatement() { complexity++; },
      WhileStatement() { complexity++; },
      DoWhileStatement() { complexity++; },
      CatchClause() { complexity++; },
      ConditionalExpression() { complexity++; },
      LogicalExpression(path) {
        if (path.node.operator === "&&" || path.node.operator === "||" || path.node.operator === "??") {
          complexity++;
        }
      },
      SwitchCase(path) {
        if (path.node.test) { // Only count actual cases, not 'default'
          complexity++;
        }
      }
    });
  } catch (error) {
    // If Babel completely fails to parse, we fallback gracefully by returning what we have
    // or we could throw, but returning empty/base values is safer for analysis stability
    // console.error("Babel parse error:", error);
  }

  return {
    imports: [...new Set(imports)],
    complexity
  };
};

module.exports = { parseJavascript };
