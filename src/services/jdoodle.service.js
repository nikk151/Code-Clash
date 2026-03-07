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
function buildWrappedScript(userCode, testCases, language) {

    if (language === "python3") {
        const inputsArray = testCases.map(tc =>
            JSON.stringify(tc.input)
        ).join(", ")

        return `
import sys
from io import StringIO

_user_code = ${JSON.stringify(userCode)}
_test_inputs = [${inputsArray}]
_DELIM = "${CASE_DELIMITER}"

for _i, _inp in enumerate(_test_inputs):
    sys.stdin = StringIO(_inp)
    _old_stdout = sys.stdout
    sys.stdout = _buf = StringIO()
    try:
        exec(_user_code)
    except Exception as _e:
        sys.stdout = _old_stdout
        print("ERROR: " + str(_e))
        if _i < len(_test_inputs) - 1:
            print(_DELIM)
        continue
    sys.stdout = _old_stdout
    print(_buf.getvalue().strip())
    if _i < len(_test_inputs) - 1:
        print(_DELIM)
`
    }

    if (language === "javascript") {
        const inputsArray = testCases.map(tc =>
            JSON.stringify(tc.input)
        ).join(", ")

        return `
const _testInputs = [${inputsArray}];
const _DELIM = "${CASE_DELIMITER}";
const _results = [];

for (const _inp of _testInputs) {
    const _lines = _inp.split("\\n");
    let _lineIdx = 0;

    const _origReadline = typeof readline !== 'undefined' ? readline : undefined;
    global.readline = () => _lines[_lineIdx++] || "";
    global.prompt = () => _lines[_lineIdx++] || "";

    let _captured = "";
    const _origLog = console.log;
    console.log = (...args) => { _captured += args.join(" ") + "\\n"; };

    try {
        eval(${JSON.stringify(userCode)});
    } catch(e) {
        _captured = "ERROR: " + e.message + "\\n";
    }

    console.log = _origLog;
    _results.push(_captured.trim());
}

console.log(_results.join("\\n" + _DELIM + "\\n"));
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
async function runAllTestCases(userCode, language, hiddenTestCases) {

    const wrapped = buildWrappedScript(userCode, hiddenTestCases, language)

    let jdoodleResult
    try {
        if (wrapped.isCStyle) {
            jdoodleResult = await executeOnJDoodle(wrapped.script, language, wrapped.stdin)
        } else {
            jdoodleResult = await executeOnJDoodle(wrapped, language, "")
        }
    } catch (apiError) {
        return {
            allPassed: false,
            error: apiError.message,
            results: [],
            passedCount: 0
        }
    }

    // Compilation or runtime error
    if (jdoodleResult.statusCode !== 200) {
        return {
            allPassed: false,
            error: jdoodleResult.output || "Unknown error",
            results: [],
            passedCount: 0
        }
    }

    // Parse the combined output into per-test-case results
    const rawOutput = jdoodleResult.output || ""
    const outputs = rawOutput.split(CASE_DELIMITER).map(o => o.trim())

    const results = []
    let allPassed = true

    for (let i = 0; i < hiddenTestCases.length; i++) {
        const expectedOutput = hiddenTestCases[i].output.trim()
        const actualOutput = outputs[i] !== undefined ? outputs[i] : ""

        const passed = actualOutput === expectedOutput

        results.push({
            testCase: i + 1,
            passed,
            yourOutput: actualOutput,
            ...(passed ? {} : { hint: "Output does not match expected result" })
        })

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
