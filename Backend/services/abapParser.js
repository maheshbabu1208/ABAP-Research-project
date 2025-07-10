exports.checkSyntax = (code) => {
    const lines = code.split('\n');
    const errors = [];

    lines.forEach((line, idx) => {
        const trimmed = line.trim();

        if (trimmed === '' || trimmed.startsWith('*') || trimmed.startsWith('"')) {
            // Empty line or comment - skip
            return;
        }

        // Allow lines ending with '.' OR ',' OR ':'
        if (
            !trimmed.endsWith('.') &&
            !trimmed.endsWith(',') &&
            !trimmed.endsWith(':')
        ) {
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

    console.log("🛠️ Executing ABAP lines...");

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        console.log(`➡️ Line ${i + 1}: ${line}`);

        // Variable or table declaration
        if (line.startsWith('DATA:')) {
            const match = line.match(/DATA:\s+(\w+)\s+TYPE\s+TABLE\s+OF\s+(\w+)/);
            if (match) {
                tables[match[1]] = [];
                console.log(`📦 Declared internal table: ${match[1]}`);
                continue;
            }

            const simpleMatch = line.match(/DATA:\s+(\w+)\s+TYPE\s+\w+/);
            if (simpleMatch) {
                variables[simpleMatch[1]] = {};
                console.log(`📦 Declared structure: ${simpleMatch[1]}`);
                continue;
            }
        }

        // Field assignment
        if (line.includes('=')) {
            const [left, right] = line.replace('.', '').split('=').map(v => v.trim());
            const [varName, prop] = left.split('-');

            if (prop) {
                if (!variables[varName]) variables[varName] = {};
                variables[varName][prop] = right.replace(/'/g, '');
                console.log(`✍️ Set ${varName}-${prop} = ${variables[varName][prop]}`);
            } else {
                variables[varName] = right.replace(/'/g, '');
                console.log(`✍️ Set ${varName} = ${variables[varName]}`);
            }
            continue;
        }

        // APPEND logic
        if (line.startsWith('APPEND')) {
            const match = line.match(/APPEND\s+(\w+)\s+TO\s+(\w+)/);
            if (match) {
                const from = match[1];
                const to = match[2];
                if (variables[from] && tables[to]) {
                    tables[to].push({ ...variables[from] });
                    console.log(`📥 Appended ${from} to ${to}`);
                }
            }
            continue;
        }

        // LOOP start
        if (line.startsWith('LOOP AT')) {
            const match = line.match(/LOOP AT\s+(\w+)\s+INTO\s+(\w+)\./);
            if (match) {
                loopTarget = match[1];
                loopVariable = match[2];
                inLoop = true;
                console.log(`🔁 Starting LOOP over ${loopTarget} INTO ${loopVariable}`);
                continue;
            }
        }

        // ENDLOOP
        if (line.startsWith('ENDLOOP')) {
            inLoop = false;
            loopTarget = null;
            loopVariable = null;
            console.log("🔚 End of LOOP");
            continue;
        }

        // Inside LOOP: WRITE logic
        if (inLoop && line.startsWith('WRITE')) {
            const targetTable = tables[loopTarget];
            if (targetTable && loopVariable) {
                targetTable.forEach(row => {
                    const match = line.match(/WRITE: \/ '(.+):',\s*(\w+)-(\w+),\s*'(.+):',\s*(\w+)-(\w+)/);
                    if (match) {
                        const [, label1, , field1, label2, , field2] = match;
                        output.push(`${label1} ${row[field1]} ${label2} ${row[field2]}`);
                    } else {
                        output.push(`Name: ${row.name} Age: ${row.age}`);
                    }
                });
            }
            continue;
        }

        // Top-level WRITE
        const writeMatch = line.match(/WRITE\s*:?\s*['"](.+)['"]/);
        if (writeMatch) {
            output.push(writeMatch[1]);
            console.log(`🖨️ Output: ${writeMatch[1]}`);
        }
    }

    return output.join('\n');
};
