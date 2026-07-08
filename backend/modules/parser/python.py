import ast
import sys
import json

def parse_python(code):
    imports = []
    complexity = 1

    try:
        tree = ast.parse(code)
    except SyntaxError:
        return {"imports": [], "complexity": 1, "error": "SyntaxError"}
    
    for node in ast.walk(tree):
        # Imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                # To capture what is imported: imports.append(f"{node.module}.{alias.name}")
                # For graph dependency, just module is usually enough:
                imports.append(node.module)
                
        # Complexity (Decision points)
        elif isinstance(node, (ast.If, ast.IfExp, ast.For, ast.While, ast.ExceptHandler, ast.With, ast.AsyncFor, ast.AsyncWith)):
            complexity += 1
        elif isinstance(node, ast.BoolOp):
            # and / or add complexity
            complexity += len(node.values) - 1

    # Deduplicate imports
    imports = list(set(imports))

    return {"imports": imports, "complexity": complexity}

if __name__ == "__main__":
    # Read from stdin
    code = sys.stdin.read()
    result = parse_python(code)
    print(json.dumps(result))
