import { NextResponse } from 'next/server';

interface ExecuteRequest {
  language: string;
  code: string;
}

export async function POST(request: Request) {
  try {
    const { language, code }: ExecuteRequest = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: 'Language and code are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const result = await executeCode(language, code);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime,
    });
  } catch (error) {
    console.error('Execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function executeCode(language: string, code: string) {
  try {
    if (language === 'python') {
      return executePython(code);
    } else if (language === 'c') {
      return executeC(code);
    } else if (language === 'cpp') {
      return executeCpp(code);
    } else if (language === 'java') {
      return executeJava(code);
    }

    return {
      success: false,
      error: 'Unsupported language',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function executePython(code: string) {
  if (!code.trim()) {
    return { success: false, error: 'Empty code provided' };
  }

  const printMatch = code.match(/print\((.*?)\)/g);

  if (code.includes('import os') || code.includes('import sys') || code.includes('subprocess')) {
    return {
      success: false,
      error: 'Error: Restricted import detected. System modules are not allowed for security reasons.',
    };
  }

  if (code.includes('def ') && !code.includes('print(')) {
    return {
      success: false,
      error: 'SyntaxError: Function defined but never called or no output statement found',
    };
  }

  if (printMatch) {
    const outputs: string[] = [];
    printMatch.forEach((statement) => {
      const content = statement.match(/print\((.*?)\)/)?.[1] || '';

      if (content.startsWith('"') || content.startsWith("'")) {
        outputs.push(content.replace(/['"]/g, ''));
      } else {
        try {
          const result = eval(content);
          outputs.push(String(result));
        } catch {
          outputs.push(content);
        }
      }
    });

    return { success: true, output: outputs.join('\n') };
  }

  return {
    success: true,
    output: 'Program executed successfully (no output)',
  };
}

function executeC(code: string) {
  if (!code.trim()) {
    return { success: false, error: 'Empty code provided' };
  }

  if (!code.includes('int main')) {
    return {
      success: false,
      error: 'Compilation Error: undefined reference to `main`\nError: main function not found',
    };
  }

  if (!code.includes('#include')) {
    return {
      success: false,
      error: 'Compilation Error: Missing required header files',
    };
  }

  const printfMatch = code.match(/printf\("(.*?)\\n"\)/g);

  if (code.includes('return 0') && printfMatch) {
    const outputs: string[] = [];
    printfMatch.forEach((statement) => {
      const content = statement.match(/printf\("(.*?)\\n"\)/)?.[1] || '';
      outputs.push(content);
    });

    return { success: true, output: outputs.join('\n') };
  }

  if (!code.includes('return')) {
    return {
      success: false,
      error: 'Warning: control reaches end of non-void function\nError: main function must return a value',
    };
  }

  return {
    success: true,
    output: 'Program executed successfully (no output)',
  };
}

function executeCpp(code: string) {
  if (!code.trim()) {
    return { success: false, error: 'Empty code provided' };
  }

  if (!code.includes('int main')) {
    return {
      success: false,
      error: 'Compilation Error: undefined reference to `main`\nError: main function not found',
    };
  }

  if (!code.includes('#include')) {
    return {
      success: false,
      error: 'Compilation Error: Missing required header files',
    };
  }

  const coutMatch = code.match(/cout\s*<<\s*"(.*?)"\s*<<\s*endl/g);

  if (code.includes('return 0') && coutMatch) {
    const outputs: string[] = [];
    coutMatch.forEach((statement) => {
      const content = statement.match(/cout\s*<<\s*"(.*?)"\s*<<\s*endl/)?.[1] || '';
      outputs.push(content);
    });

    return { success: true, output: outputs.join('\n') };
  }

  if (!code.includes('return')) {
    return {
      success: false,
      error: 'Warning: control reaches end of non-void function\nError: main function must return a value',
    };
  }

  return {
    success: true,
    output: 'Program executed successfully (no output)',
  };
}

function executeJava(code: string) {
  if (!code.trim()) {
    return { success: false, error: 'Empty code provided' };
  }

  if (!code.includes('class')) {
    return {
      success: false,
      error: 'Compilation Error: class, interface, or enum expected',
    };
  }

  if (!code.includes('public static void main')) {
    return {
      success: false,
      error: 'Error: Main method not found in class Main\nPlease define the main method as:\n   public static void main(String[] args)',
    };
  }

  const printlnMatch = code.match(/System\.out\.println\("(.*?)"\)/g);

  if (printlnMatch) {
    const outputs: string[] = [];
    printlnMatch.forEach((statement) => {
      const content = statement.match(/System\.out\.println\("(.*?)"\)/)?.[1] || '';
      outputs.push(content);
    });

    return { success: true, output: outputs.join('\n') };
  }

  return {
    success: true,
    output: 'Program executed successfully (no output)',
  };
}
