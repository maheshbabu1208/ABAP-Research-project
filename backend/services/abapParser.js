// abapParse.js
// Full ABAP simulator supporting DATA, APPEND, WRITE, LOOP, WHILE, DO, IF/ELSE, CASE

exports.checkSyntax = (code) => {
    const lines = code.split('\n');
    const errors = [];
    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('*') || trimmed.startsWith('"')) return;
        if (!trimmed.endsWith('.') && !trimmed.endsWith(',') && !trimmed.endsWith(':')) {
            errors.push(`Line ${idx + 1}: Missing period/comma/colon.`);
        }
    });
    return errors;
};

exports.executeCode = (code) => {
    const lines = code.split('\n');
    const output = [];

    const variables = {};
    const tables = {};

    let loopTarget = null;
    let loopVariable = null;
    let inLoop = false;

    let whileCondition = null;
    let whileStartLine = null;

    let doCount = null;
    let doStartLine = null;
    let doIndex = 0;

    // IF stack tracks skip and executed status
    let ifStack = [];

    // CASE stack tracks varName, executed flag, skip status
    let caseStack = [];

    function evaluateCondition(varValue, operator, val) {
        const isNumVar = !isNaN(varValue);
        const isNumVal = !isNaN(val);
        if (isNumVar && isNumVal) {
            switch (operator) {
                case '=': return Number(varValue) === Number(val);
                case '<>': return Number(varValue) !== Number(val);
                case '<': return Number(varValue) < Number(val);
                case '<=': return Number(varValue) <= Number(val);
                case '>': return Number(varValue) > Number(val);
                case '>=': return Number(varValue) >= Number(val);
                default: return false;
            }
        } else {
            switch (operator) {
                case '=': return varValue == val;
                case '<>': return varValue != val;
                default: return false; // cannot use <, > with strings
            }
        }
    }

    function evalWriteParts(parts, row = null) {
        return parts
            .map(p => {
                p = p.trim().replace(/'/g, '');
                if (!p) return '';
                if (p.includes('-')) {
                    const [varName, field] = p.split('-');
                    if (row && row[field] !== undefined) return row[field];
                    if (variables[varName] && typeof variables[varName] === 'object') return variables[varName][field] || '';
                }
                if (variables[p] !== undefined) return variables[p];
                return p;
            })
            .join(' ');
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // ------------------ DATA Declaration ------------------
        if (line.startsWith('DATA:')) {
            const tableMatch = line.match(/DATA:\s+(\w+)\s+TYPE\s+TABLE\s+OF\s+(\w+)/);
            if (tableMatch) {
                tables[tableMatch[1]] = [];
                continue;
            }

            const simpleMatch = line.match(/DATA:\s+(\w+)\s+TYPE\s+\w+(\s+VALUE\s+(.+?))?/);
            if (simpleMatch) {
                const name = simpleMatch[1];
                let valRaw = simpleMatch[3];
                let init = 0;
                if (valRaw) {
                    valRaw = valRaw.trim().replace(/'/g, '');
                    init = isNaN(valRaw) ? valRaw : parseInt(valRaw, 10);
                }
                variables[name] = init;
                continue;
            }
        }

        // ------------------ WHILE / ENDWHILE ------------------
        if (line.startsWith('WHILE')) {
            const match = line.match(/WHILE\s+(\w+)\s*([<>=]+)\s*(.+)\./);
            if (match) {
                const [, varName, op, valRaw] = match;
                const val = valRaw.trim().replace(/'/g, '');
                whileCondition = { varName, op, val };
                whileStartLine = i + 1;
            }
            continue;
        }

        if (line.startsWith('ENDWHILE')) {
            if (whileCondition) {
                const { varName, op, val } = whileCondition;
                if (evaluateCondition(variables[varName], op, val)) {
                    i = whileStartLine - 1;
                } else {
                    whileCondition = null;
                    whileStartLine = null;
                }
            }
            continue;
        }

        // ------------------ DO / ENDDO ------------------
        if (line.startsWith('DO')) {
            const match = line.match(/DO\s+(\d+)\s+TIMES\./);
            if (match) {
                doCount = parseInt(match[1], 10);
                doStartLine = i + 1;
                doIndex = 1;
            }
            continue;
        }

        if (line.startsWith('ENDDO')) {
            if (doCount) {
                if (doIndex < doCount) {
                    doIndex++;
                    i = doStartLine - 1;
                } else {
                    doCount = null;
                    doStartLine = null;
                    doIndex = 0;
                }
            }
            continue;
        }

        // ------------------ IF / ELSEIF / ELSE / ENDIF ------------------
        if (line.startsWith('IF')) {
            const match = line.match(/IF\s+(\w+)\s*([<>=]+)\s*(.+)\./);
            if (match) {
                const [, varName, op, valRaw] = match;
                const val = valRaw.trim().replace(/'/g, '');
                const condition = evaluateCondition(variables[varName], op, val);
                ifStack.push({ executed: condition, skip: !condition, done: condition });
            }
            continue;
        }

        if (line.startsWith('ELSEIF')) {
            const match = line.match(/ELSEIF\s+(\w+)\s*([<>=]+)\s*(.+)\./);
            if (match) {
                const [, varName, op, valRaw] = match;
                const val = valRaw.trim().replace(/'/g, '');
                const top = ifStack[ifStack.length - 1];
                if (!top.done) {
                    const condition = evaluateCondition(variables[varName], op, val);
                    top.skip = !condition;
                    top.done = condition;
                } else {
                    top.skip = true;
                }
            }
            continue;
        }

        if (line.startsWith('ELSE')) {
            const top = ifStack[ifStack.length - 1];
            top.skip = top.done; // skip if already executed
            top.done = true;
            top.skip = !top.skip;
            continue;
        }

        if (line.startsWith('ENDIF')) {
            ifStack.pop();
            continue;
        }

        // ------------------ CASE / WHEN / WHEN OTHERS / ENDCASE ------------------
        if (line.startsWith('CASE')) {
            const varName = line.split(' ')[1].replace('.', '');
            caseStack.push({ varName, executed: false, skip: true });
            continue;
        }

        if (line.startsWith('WHEN OTHERS')) {
            const top = caseStack[caseStack.length - 1];
            top.skip = top.executed; // skip if a previous WHEN executed
            top.executed = true; // mark executed
            top.skip = !top.skip; // flip skip for output
            continue;
        }

        if (line.startsWith('WHEN')) {
            const top = caseStack[caseStack.length - 1];
            const val = line.replace(/^WHEN\s+/, '').replace(/\./, '').replace(/'/g, '');
            if (!top.executed && variables[top.varName] == val) {
                top.skip = false;
                top.executed = true;
            } else {
                top.skip = true;
            }
            continue;
        }

        if (line.startsWith('ENDCASE')) {
            caseStack.pop();
            continue;
        }

        // ------------------ ADD ------------------
        if (line.startsWith('ADD')) {
            const match = line.match(/ADD\s+(\d+)\s+TO\s+(\w+)/);
            if (match) {
                const [, inc, varName] = match;
                variables[varName] = (parseInt(variables[varName]) || 0) + parseInt(inc, 10);
            }
            continue;
        }

        // ------------------ WRITE ------------------
        if (line.startsWith('WRITE')) {
            let parts = line.replace(/^WRITE:?\s*\/?\s*/, '').replace(/\.$/, '').split(',');
            if (inLoop && loopTarget) {
                const targetTable = tables[loopTarget];
                if (targetTable) {
                    targetTable.forEach(row => output.push(evalWriteParts(parts, row)));
                }
            } else {
                output.push(evalWriteParts(parts));
            }
            continue;
        }

        // ------------------ Assignment ------------------
        if (line.includes('=')) {
            const [left, right] = line.replace('.', '').split('=').map(v => v.trim());
            const [varName, field] = left.split('-');
            const val = right.replace(/'/g, '');
            if (field) {
                if (!variables[varName]) variables[varName] = {};
                variables[varName][field] = isNaN(val) ? val : parseInt(val, 10);
            } else {
                variables[varName] = isNaN(val) ? val : parseInt(val, 10);
            }
            continue;
        }

        // ------------------ APPEND ------------------
        if (line.startsWith('APPEND')) {
            const match = line.match(/APPEND\s+(\w+)\s+TO\s+(\w+)/);
            if (match) {
                const [, from, to] = match;
                if (variables[from] && tables[to]) tables[to].push({ ...variables[from] });
            }
            continue;
        }

        // ------------------ LOOP AT / ENDLOOP ------------------
        if (line.startsWith('LOOP AT')) {
            const match = line.match(/LOOP AT\s+(\w+)\s+INTO\s+(\w+)\./);
            if (match) {
                loopTarget = match[1];
                loopVariable = match[2];
                inLoop = true;
            }
            continue;
        }

        if (line.startsWith('ENDLOOP')) {
            inLoop = false;
            loopTarget = null;
            loopVariable = null;
            continue;
        }
    }

    return output.join('\n');
};
