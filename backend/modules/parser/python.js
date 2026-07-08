const { execFileSync } = require("child_process");
const path = require("path");

const parsePython = (content) => {
  try {
    const scriptPath = path.join(__dirname, "python.py");
    // Run the python script synchronously, passing content via stdin
    // Use timeout to prevent hanging on weird inputs
    const stdout = execFileSync("python3", [scriptPath], {
      input: content,
      encoding: "utf-8",
      timeout: 2000, 
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });

    const result = JSON.parse(stdout.trim());
    
    if (result.error) {
       return null; // Signals failure, fallback handles it
    }

    return {
      imports: result.imports || [],
      complexity: result.complexity || 1
    };
  } catch (err) {
    // console.error("Python parse error:", err);
    return null;
  }
};

module.exports = { parsePython };
