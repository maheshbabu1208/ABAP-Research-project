const { checkSyntax, executeCode } = require('../services/abapParser');

exports.runAbapCode = (req, res) => {
    console.log("🔥 POST /run received!");
    const code = req.body.code;
    console.log("🔍 Received ABAP Code:\n", code);

    const syntaxErrors = checkSyntax(code);
    if (syntaxErrors.length > 0) {
        console.log("❌ Syntax Errors:", syntaxErrors);
        return res.json({ output: null, errors: syntaxErrors });
    }

    const output = executeCode(code);
    console.log("✅ Execution Output:\n", output);
    return res.json({ output, errors: [] });
};
