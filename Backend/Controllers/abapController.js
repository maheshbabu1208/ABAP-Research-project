const { checkSyntax, executeCode } = require('../services/abapParser');

exports.runAbapCode = (req, res) => {
    const code = req.body.code;
    const syntaxErrors = checkSyntax(code);
    if (syntaxErrors.length > 0) {
        return res.json({ output: null, errors: syntaxErrors });
    }

    const output = executeCode(code);
    res.json({ output, errors: [] });
};
