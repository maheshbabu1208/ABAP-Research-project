exports.checkSyntax = (code) => {
    const lines = code.split('\n');
    const errors = [];
    lines.forEach((line, idx) => {
        if (!line.trim().endsWith('.')) {
            errors.push(`Line ${idx + 1}: Missing period.`);
        }
    });
    return errors;
};

exports.executeCode = (code) => {
    let output = '';
    let variables = {};

    code.split('\n').forEach((line) => {
        line = line.trim();

        if (line.startsWith('WRITE')) {
            const match = line.match(/WRITE\s+'(.+)'./);
            if (match) output += match[1] + '\n';
        }

        if (line.startsWith('DATA')) {
            const match = line.match(/DATA:\s+(\w+)\s+TYPE\s+\w+\./);
            if (match) variables[match[1]] = 0;
        }

        if (line.includes('=')) {
            const [varName, val] = line.replace('.', '').split('=').map(v => v.trim());
            if (variables.hasOwnProperty(varName)) {
                variables[varName] = Number(val);
            }
        }

        if (line.startsWith('IF')) {
            const match = line.match(/IF\s+(\w+)\s+>\s+(\d+)./);
            if (match && variables[match[1]] > Number(match[2])) {
                output += 'Condition passed\n';
            }
        }
    });

    return output;
};
