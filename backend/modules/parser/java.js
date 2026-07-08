const { parse, BaseJavaCstVisitorWithDefaults } = require("java-parser");

class JavaParserVisitor extends BaseJavaCstVisitorWithDefaults {
  constructor() {
    super();
    this.imports = [];
    this.complexity = 1;
    this.validateVisitor();
  }

  importDeclaration(ctx) {
    if (ctx.packageOrTypeName) {
      // packageOrTypeName contains the parts of the import path
      // Extract the identifiers from the tokens
      const pathParts = [];
      
      const processName = (node) => {
        if (node.Identifier) {
          pathParts.push(node.Identifier[0].image);
        }
        if (node.dot) {
           // We have dots
        }
      };
      
      // We can just fallback to stringifying the tokens inside packageOrTypeName
      // Actually it's easier to just pull the image from all Identifiers in the context
      let importPath = "";
      if (ctx.packageOrTypeName[0] && ctx.packageOrTypeName[0].children) {
         const children = ctx.packageOrTypeName[0].children;
         if (children.Identifier) {
            importPath = children.Identifier.map(id => id.image).join(".");
         }
      }
      
      if (ctx.star) {
         importPath += ".*";
      }

      if (importPath) {
        this.imports.push(importPath);
      }
    }
    super.importDeclaration(ctx);
  }

  ifStatement(ctx) {
    this.complexity++;
    super.ifStatement(ctx);
  }

  forStatement(ctx) {
    this.complexity++;
    super.forStatement(ctx);
  }

  whileStatement(ctx) {
    this.complexity++;
    super.whileStatement(ctx);
  }
  
  doStatement(ctx) {
    this.complexity++;
    super.doStatement(ctx);
  }

  switchLabel(ctx) {
    if (ctx.Case) {
      this.complexity++;
    }
    super.switchLabel(ctx);
  }

  catchClause(ctx) {
    this.complexity++;
    super.catchClause(ctx);
  }
  
  ternaryExpression(ctx) {
    this.complexity++;
    super.ternaryExpression(ctx);
  }
  
  binaryExpression(ctx) {
    if (ctx.BinaryOperator) {
       for (const op of ctx.BinaryOperator) {
           if (op.image === "&&" || op.image === "||") {
               this.complexity++;
           }
       }
    }
    super.binaryExpression(ctx);
  }
}

const parseJava = (content) => {
  try {
    const cst = parse(content);
    const visitor = new JavaParserVisitor();
    visitor.visit(cst);
    
    return {
      imports: [...new Set(visitor.imports)],
      complexity: visitor.complexity
    };
  } catch (err) {
    return null; // Signals failure, fallback will handle it
  }
};

module.exports = { parseJava };
