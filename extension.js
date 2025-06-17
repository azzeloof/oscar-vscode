const vscode = require('vscode');
const net = require('net');

const HOST = '127.0.0.1';
const PORT = 5555;

/**
 * Gets the indentation (number of leading spaces) of a line of text.
 * @param {string} text The text of the line.
 * @returns {number} The number of leading spaces.
 */
function getIndentation(text) {
    let match = text.match(/^\s*/);
    return match ? match[0].length : 0;
}

/**
 * Counts the net change in open brackets on a line of code.
 * Ignores brackets inside basic strings for accuracy.
 * @param {string} text The text of the line.
 * @param {object} counts An object like { parens: 0, brackets: 0, braces: 0 }.
 */
function countBrackets(text, counts) {
    let in_string = null;
    // This basic parser doesn't handle escaped quotes, but is good enough for this use case.
    for (const char of text) {
        if (in_string) {
            if (char === in_string) {
                in_string = null;
            }
            continue;
        }
        switch (char) {
            case "'": case '"': in_string = char; break;
            case '(': counts.parens++; break;
            case ')': counts.parens--; break;
            case '[': counts.brackets++; break;
            case ']': counts.brackets--; break;
            case '{': counts.braces++; break;
            case '}': counts.braces--; break;
        }
    }
}

// Define the decoration style for the highlight.
const highlightDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.selectionHighlightBackground'),
    border: '1px solid ' + new vscode.ThemeColor('editor.selectionHighlightBorder'),
    borderRadius: '2px'
});


async function activate(context) {
    console.log('Congratulations, your extension "oscar-vscode" is now active!');

    // --- ADDED BACK: Check for and prompt to configure file association ---
    const filesConfig = vscode.workspace.getConfiguration('files');
    const associations = filesConfig.get('associations');

    if (!associations || associations['*.os'] !== 'python') {
        const message = 'The Oscar extension requires ".os" files to be associated with Python for full functionality (e.g., auto-indent). Would you like to automatically configure this in your user settings?';
        const action = 'Yes, Configure';

        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                // Get the current settings and update them
                const newAssociations = { ...associations, ...{ '*.os': 'python' } };
                filesConfig.update('associations', newAssociations, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('File association for ".os" has been set. This may require a reload to take full effect.');
            }
        });
    }

    // Register the command for evaluating code blocks
    let disposable = vscode.commands.registerCommand('oscar-vscode.evaluateBlock', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        const document = editor.document;
        const selection = editor.selection;
        let rangeToHighlight;

        if (selection.isEmpty) {
            const cursorLineNum = selection.active.line;
            const cursorLine = document.lineAt(cursorLineNum);

            if (cursorLine.isEmptyOrWhitespace) { return; }

            let blockStartLineNum = cursorLineNum;
            
            // Walk UP to find the start of the current logical block.
            for (let i = cursorLineNum; i >= 0; i--) {
                const line = document.lineAt(i);
                if (line.isEmptyOrWhitespace) continue;

                const lineIndent = getIndentation(line.text);
                if (lineIndent === 0) {
                    blockStartLineNum = i;
                    break;
                }
                if (i > 0) {
                    const prevLine = document.lineAt(i - 1);
                    if (!prevLine.isEmptyOrWhitespace && getIndentation(prevLine.text) < lineIndent) {
                        blockStartLineNum = i;
                    }
                }
            }
            
            let blockEndLineNum = blockStartLineNum;
            const blockStartIndent = getIndentation(document.lineAt(blockStartLineNum).text);
            
            let bracketCounts = { parens: 0, brackets: 0, braces: 0 };
            for (let i = blockStartLineNum; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const lineIndent = getIndentation(line.text);
                
                // Termination condition must be checked BEFORE processing the line.
                const allBracketsClosed = bracketCounts.parens === 0 && bracketCounts.brackets === 0 && bracketCounts.braces === 0;
                
                if (allBracketsClosed && !line.isEmptyOrWhitespace && lineIndent <= blockStartIndent && i > blockStartLineNum) {
                    break; 
                }
                
                countBrackets(line.text, bracketCounts);
                blockEndLineNum = i;
            }

            const startPos = document.lineAt(blockStartLineNum).range.start;
            const endPos = document.lineAt(blockEndLineNum).range.end;
            rangeToHighlight = new vscode.Range(startPos, endPos);

        } else {
            const start = document.lineAt(selection.start.line).range.start;
            const end = document.lineAt(selection.end.line).range.end;
            rangeToHighlight = new vscode.Range(start, end);
        }

        const textToSend = document.getText(rangeToHighlight);

        if (!textToSend || textToSend.trim() === '') { return; }

        // Apply and remove the highlight
        editor.setDecorations(highlightDecorationType, [rangeToHighlight]);
        setTimeout(() => {
            editor.setDecorations(highlightDecorationType, []);
        }, 500);
        
        // Networking code
        const client = new net.Socket();
        client.connect(PORT, HOST, () => {
            client.write(textToSend);
            client.end();
        });
        client.on('error', (err) => vscode.window.showErrorMessage(`Oscar Connection Error: ${err.message}`));
    });

    context.subscriptions.push(disposable);
}

function deactivate() {
    highlightDecorationType.dispose();
}

module.exports = {
    activate,
    deactivate
}