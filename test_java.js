const { parse } = require("java-parser");
const javaCode = `
import java.util.List;
import com.example.MyClass;
public class Main {
    public static void main(String[] args) {
        if (true) {
            System.out.println("Hello");
        }
    }
}
`;
const cst = parse(javaCode);
console.log(Object.keys(cst.children));
