/**
 * JDoodle Service — handles all code execution logic.
 * Builds language-specific wrapper scripts and calls the JDoodle API.
 */

const config = require("../config")


// Delimiter used to separate outputs of different test cases
const CASE_DELIMITER = "<<==CASE_BOUNDARY==>>"

// JDoodle language configs: { language, versionIndex }
const LANGUAGE_CONFIG = {
    python3: { language: "python3", versionIndex: "4" },
    java: { language: "java", versionIndex: "4" },
    cpp: { language: "cpp17", versionIndex: "1" },
    c: { language: "c", versionIndex: "5" },
    javascript: { language: "nodejs", versionIndex: "4" }
}


/**
 * Check if a language is supported
 */
function isLanguageSupported(language) {
    return !!LANGUAGE_CONFIG[language]
}

/**
 * Get list of supported language names
 */
function getSupportedLanguages() {
    return Object.keys(LANGUAGE_CONFIG)
}


/**
 * Builds a wrapper script that runs the user's code against ALL test cases
 * in a single execution. Each test case output is separated by CASE_DELIMITER.
 * This way we only use 1 JDoodle API call per submission, no matter the test count.
 */
function buildWrappedScript(userCode, testCases, language, functionName = null) {

    if (language === "python3") {
        const inputsArray = testCases.map(tc =>
            JSON.stringify(tc.input)
        ).join(", ")

        return `
import sys
import json
from io import StringIO

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def arr_to_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for i in range(1, len(arr)):
        curr.next = ListNode(arr[i])
        curr = curr.next
    return head

def list_to_arr(node):
    res = []
    while node:
        res.append(node.val)
        node = node.next
    return res

_user_code = ${JSON.stringify(userCode)}
_test_inputs = [${inputsArray}]
_DELIM = "${CASE_DELIMITER}"
_fn_name_override = ${JSON.stringify(functionName)}

for _i, _inp in enumerate(_test_inputs):
    _old_stdout = sys.stdout
    sys.stdout = _buf = StringIO()
    try:
        # Define local scope
        _context = {"ListNode": ListNode, "arr_to_list": arr_to_list, "list_to_arr": list_to_arr}
        exec(_user_code, globals(), _context)
        
        # Detect function name
        _fn_name = _fn_name_override
        if not _fn_name:
            import re
            _code_no_comments = re.sub(r'#.*|\\'\\'\\'.*?\\'\\'\\'|\\".*?\\"', '', _user_code, flags=re.DOTALL)
            _fn_match = re.search(r"def\\s+([a-zA-Z0-9_]+)\\s*\\(", _code_no_comments)
            if _fn_match: _fn_name = _fn_match.group(1)
        
        if _fn_name:
            if _fn_name in _context:
                _args_raw = json.loads("[" + _inp + "]")
                _args_converted = []
                for _arg in _args_raw:
                    if isinstance(_arg, list) and "ListNode" in _user_code:
                        _args_converted.append(arr_to_list(_arg))
                    else:
                        _args_converted.append(_arg)
                
                _res = _context[_fn_name](*_args_converted)
                
                if _res is not None:
                    if isinstance(_res, ListNode) or (hasattr(_res, "val") and hasattr(_res, "next")):
                        print(json.dumps(list_to_arr(_res)))
                    else:
                        print(json.dumps(_res))
                             
    except Exception as _e:
        sys.stdout = _old_stdout
        print("ERROR: " + str(_e))
        if _i < len(_test_inputs) - 1:
            print(_DELIM)
        continue
    sys.stdout = _old_stdout
    output = _buf.getvalue().strip()
    if output:
        print(output)
    if _i < len(_test_inputs) - 1:
        print(_DELIM)
`
    }

    if (language === "javascript") {
        const inputsArray = testCases.map(tc =>
            JSON.stringify(tc.input)
        ).join(", ")

        return `
// --- Built-in Data Structures ---
function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}

function TreeNode(val, left, right) {
    this.val = (val === undefined ? 0 : val);
    this.left = (left === undefined ? null : left);
    this.right = (right === undefined ? null : right);
}

// --- Conversion Helpers ---
function arrayToLinkedList(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    let head = new ListNode(arr[0]);
    let current = head;
    for (let i = 1; i < arr.length; i++) {
        current.next = new ListNode(arr[i]);
        current = current.next;
    }
    return head;
}

function linkedListToArray(head) {
    let arr = [];
    let current = head;
    while (current) {
        arr.push(current.val);
        current = current.next;
    }
    return arr;
}

function arrayToTree(arr) {
    if (!arr.length) return null;
    let root = new TreeNode(arr[0]);
    let queue = [root];
    let i = 1;
    while (i < arr.length) {
        let curr = queue.shift();
        if (arr[i] !== null) {
            curr.left = new TreeNode(arr[i]);
            queue.push(curr.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            curr.right = new TreeNode(arr[i]);
            queue.push(curr.right);
        }
        i++;
    }
    return root;
}

function treeToArray(root) {
    if (!root) return [];
    let result = [];
    let queue = [root];
    while (queue.length > 0) {
        let node = queue.shift();
        if (node) {
            result.push(node.val);
            queue.push(node.left);
            queue.push(node.right);
        } else {
            result.push(null);
        }
    }
    while (result[result.length - 1] === null) result.pop();
    return result;
}

const _testInputs = [${inputsArray}];
const _DELIM = "${CASE_DELIMITER}";
const _results = [];
const _fnNameOverride = ${JSON.stringify(functionName)};

for (const _inp of _testInputs) {
    let _captured = "";
    const _origLog = console.log;
    console.log = (...args) => { _captured += args.join(" ") + "\\n"; };

    try {
        // Evaluate user code
        eval(${JSON.stringify(userCode)});
        
        // Find function name (ignoring comments)
        let _fnName = _fnNameOverride;
        if (!_fnName) {
            const _codeNoComments = ${JSON.stringify(userCode)}.replace(/\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*/g, "");
            const _fnMatch = _codeNoComments.match(/(?:function\\s+|const\\s+|let\\s+|var\\s+)([a-zA-Z0-9_]+)\\s*=\\s*(?:async\\s*)?\\(|function\\s+([a-zA-Z0-9_]+)\\s*\\(/);
            _fnName = _fnMatch ? (_fnMatch[1] || _fnMatch[2]) : null;
        }

        if (_fnName) {
            const _argsRaw = JSON.parse('[' + _inp + ']');
            const _argsConverted = _argsRaw.map(function(arg) {
                if (Array.isArray(arg)) {
                    if (${JSON.stringify(userCode)}.indexOf("ListNode") !== -1 && arg.length > 0) return arrayToLinkedList(arg);
                    if (${JSON.stringify(userCode)}.indexOf("TreeNode") !== -1 && arg.length > 0) return arrayToTree(arg);
                }
                return arg;
            });

            try {
                const _res = eval(_fnName + "(..._argsConverted)");
                
                if (_res !== undefined && _res !== null) {
                    if ((_res instanceof ListNode) || (_res.next !== undefined && _res.val !== undefined)) {
                        _captured += JSON.stringify(linkedListToArray(_res));
                    } else if ((_res instanceof TreeNode) || ((_res.left !== undefined || _res.right !== undefined) && _res.val !== undefined)) {
                        _captured += JSON.stringify(treeToArray(_res));
                    } else {
                        _captured += JSON.stringify(_res);
                    }
                }
            } catch(callError) {
                _captured += "RUNTIME ERROR: " + callError.message;
            }
        }
    } catch(e) {
        _captured = "ERROR: " + e.message;
    }

    _results.push(_captured.trim());
}

process.stdout.write(_results.join("\\n" + _DELIM + "\\n"));
`
    }

    if (language === "java") {
        const inputsList = testCases.map(tc =>
            JSON.stringify(tc.input)
        ).join(", ")

        return `
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] _args) throws Exception {
        String[] _inputs = {${inputsList}};
        String _DELIM = "${CASE_DELIMITER}";

        for (int _i = 0; _i < _inputs.length; _i++) {
            System.setIn(new ByteArrayInputStream(_inputs[_i].getBytes()));
            ByteArrayOutputStream _baos = new ByteArrayOutputStream();
            PrintStream _ps = new PrintStream(_baos);
            System.setOut(_ps);

            try {
                ${userCode}
            } catch (Exception _e) {
                System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.out)));
                System.out.println("ERROR: " + _e.getMessage());
                if (_i < _inputs.length - 1) System.out.println(_DELIM);
                continue;
            }

            System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.out)));
            System.out.print(_baos.toString().trim());
            if (_i < _inputs.length - 1) {
                System.out.println();
                System.out.println(_DELIM);
            }
        }
        System.out.println();
    }
}
`
    }

    if (language === "cpp" || language === "c") {
        const lang = language === "cpp" ? "cpp" : "c"
        const includes = lang === "cpp"
            ? '#include <bits/stdc++.h>\nusing namespace std;'
            : '#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>'

        const numTests = testCases.length
        const combinedInput = testCases.map(tc => tc.input).join("\n")

        return {
            isCStyle: true,
            script: `${includes}

void solve() {
    ${userCode}
}

int main() {
    int _t = ${numTests};
    for (int _i = 0; _i < _t; _i++) {
        solve();
        if (_i < _t - 1) printf("${CASE_DELIMITER}\\n");
    }
    return 0;
}`,
            stdin: combinedInput
        }
    }

    throw new Error(`Unsupported language: ${language}`)
}


/**
 * Calls the JDoodle API to execute a script
 */
async function executeOnJDoodle(script, language, stdin) {
    const langConfig = LANGUAGE_CONFIG[language]

    if (!langConfig) {
        throw new Error(`Unsupported language: ${language}`)
    }

    const response = await fetch(config.jdoodle.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            clientId: config.jdoodle.clientId,
            clientSecret: config.jdoodle.clientSecret,
            script,
            language: langConfig.language,
            versionIndex: langConfig.versionIndex,
            stdin: stdin || ""
        })
    })

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("JDoodle API Error: Invalid Client ID or Secret")
        }
        if (response.status === 429) {
            throw new Error("JDoodle API Error: Daily credit limit reached!")
        }
        throw new Error(`JDoodle API Error: ${response.status}`)
    }

    return await response.json()
}


/**
 * Runs user code against all test cases in a single JDoodle API call.
 * Returns { allPassed, results[], error? }
 */
const fs = require('fs')
const path = require('path')

async function runAllTestCases(userCode, language, testCases, isHidden = false, functionName = null) {
    const debugFile = path.resolve(__dirname, "../../debug_jdoodle.log")
    const wrapped = buildWrappedScript(userCode, testCases, language, functionName)

    let jdoodleResult
    try {
        if (wrapped.isCStyle) {
            jdoodleResult = await executeOnJDoodle(wrapped.script, language, wrapped.stdin)
        } else {
            jdoodleResult = await executeOnJDoodle(wrapped, language, "")
        }
    } catch (apiError) {
        fs.appendFileSync(debugFile, `API ERROR: ${apiError.message}\n`)
        return {
            allPassed: false,
            error: apiError.message,
            results: [],
            passedCount: 0
        }
    }

    fs.appendFileSync(debugFile, `--- DEBUG LOG ---\nWRAPPED SCRIPT:\n${JSON.stringify(wrapped)}\nJDOODLE RESULT:\n${JSON.stringify(jdoodleResult)}\n`)

    if (jdoodleResult.statusCode !== 200) {
        return {
            allPassed: false,
            error: jdoodleResult.output || "Unknown error",
            results: [],
            passedCount: 0
        }
    }

    const rawOutput = jdoodleResult.output || ""
    const outputs = rawOutput.split(CASE_DELIMITER).map(o => o.trim())

    const results = []
    let allPassed = true

    for (let i = 0; i < testCases.length; i++) {
        const expectedOutput = testCases[i].output.trim()
        const actualOutput = outputs[i] !== undefined ? outputs[i] : ""

        const passed = actualOutput === expectedOutput

        const resultObj = {
            testCase: i + 1,
            passed,
            yourOutput: actualOutput,
            ...(passed ? {} : { hint: "Output does not match expected result" })
        }

        if (!isHidden) {
            resultObj.input = testCases[i].input;
            resultObj.expectedOutput = expectedOutput;
        }

        results.push(resultObj)

        if (!passed) allPassed = false
    }

    return {
        allPassed,
        results,
        passedCount: results.filter(r => r.passed).length
    }
}


module.exports = {
    isLanguageSupported,
    getSupportedLanguages,
    runAllTestCases
}
