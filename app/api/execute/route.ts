import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

interface ExecuteRequest {
  language: string;
  code: string;
}

let wss: WebSocketServer | null = null;

function getWebSocketServer() {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    wss.on('connection', (ws) => {
      ws.on('message', async (message) => {
        try {
          const { language, code }: ExecuteRequest = JSON.parse(message.toString());

          if (!code || !language) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Language and code are required'
            }));
            return;
          }

          const startTime = Date.now();

          // Send start message
          ws.send(JSON.stringify({ type: 'start' }));

          try {
            await executeCodeStreaming(language, code, (output, error) => {
              if (error) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: error
                }));
              } else if (output) {
                ws.send(JSON.stringify({
                  type: 'output',
                  data: output
                }));
              }
            });

            const executionTime = Date.now() - startTime;
            ws.send(JSON.stringify({
              type: 'complete',
              executionTime
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              message: error instanceof Error ? error.message : 'Execution failed'
            }));
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid request format'
          }));
        }
      });
    });
  }
  return wss;
}

export async function GET(request: Request) {
  // Handle WebSocket upgrade
  const upgradeHeader = request.headers.get('upgrade');
  if (upgradeHeader === 'websocket') {
    // This is handled by Next.js automatically for WebSocket routes
    return new Response('WebSocket upgrade required', { status: 426 });
  }

  return NextResponse.json({ message: 'WebSocket endpoint - use WebSocket connection' });
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

    // Security checks
    if (code.length > 10000) { // 10KB limit
      return NextResponse.json(
        { success: false, error: 'Code is too large. Maximum size is 10KB.' },
        { status: 400 }
      );
    }

    // Additional security checks for dangerous patterns
    const dangerousPatterns = [
      /import\s+os/i,
      /import\s+sys/i,
      /import\s+subprocess/i,
      /import\s+shutil/i,
      /import\s+socket/i,
      /exec\(/,
      /eval\(/,
      /open\(/,
      /file\(/,
      /__import__/,
      /system\(/,
      /popen\(/,
      /fork\(/,
      /kill\(/,
      /chmod\(/,
      /chown\(/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return NextResponse.json(
          { success: false, error: 'Code contains potentially dangerous operations that are not allowed.' },
          { status: 400 }
        );
      }
    }

    const startTime = Date.now();

    // Collect all output and errors during execution
    const outputs: string[] = [];
    const errors: string[] = [];

    try {
      await executeCodeStreaming(language, code, (output, error) => {
        if (output) {
          outputs.push(output);
        }
        if (error) {
          errors.push(error);
        }
      });

      const executionTime = Date.now() - startTime;

      return NextResponse.json({
        success: errors.length === 0,
        output: outputs.join(''),
        error: errors.join(''),
        executionTime,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime,
      });
    }
  } catch (error) {
    console.error('Execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// WebSocket server setup for Next.js
export const dynamic = 'force-dynamic';

async function executeCode(language: string, code: string) {
  try {
    if (language === 'python') {
      return await executePython(code);
    } else if (language === 'c') {
      return await executeC(code);
    } else if (language === 'cpp') {
      return await executeCpp(code);
    } else if (language === 'java') {
      return await executeJava(code);
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

async function executeCodeStreaming(
  language: string,
  code: string,
  onOutput: (output?: string, error?: string) => void
): Promise<void> {
  try {
    if (language === 'python') {
      return await executePythonStreaming(code, onOutput);
    } else if (language === 'c') {
      return await executeCStreaming(code, onOutput);
    } else if (language === 'cpp') {
      return await executeCppStreaming(code, onOutput);
    } else if (language === 'java') {
      return await executeJavaStreaming(code, onOutput);
    }

    onOutput(undefined, 'Unsupported language');
  } catch (error) {
    onOutput(undefined, error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

async function executePython(code: string): Promise<{ success: boolean; output?: string; error?: string }> {
  if (!code.trim()) {
    return { success: false, error: 'Empty code provided' };
  }

  // Security check - restrict dangerous imports
  if (code.includes('import os') || code.includes('import sys') || code.includes('subprocess') ||
    code.includes('import shutil') || code.includes('import socket')) {
    return {
      success: false,
      error: 'Error: Restricted import detected. System modules are not allowed for security reasons.',
    };
  }

  const tempFile = join(tmpdir(), `code_${Date.now()}.py`);

  try {
    await writeFile(tempFile, code);

    return new Promise((resolve) => {
      const python = spawn('python3', [tempFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000, // 10 second timeout
      });

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: output || 'Program executed successfully (no output)' });
        } else {
          resolve({ success: false, error: error || 'Execution failed' });
        }
      });

      python.on('error', (err) => {
        resolve({ success: false, error: `Failed to start Python: ${err.message}` });
      });
    });
  } catch (error) {
    return { success: false, error: `File operation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function executePythonStreaming(
  code: string,
  onOutput: (output?: string, error?: string) => void
): Promise<void> {
  if (!code.trim()) {
    onOutput(undefined, 'Empty code provided');
    return;
  }

  // Security check - restrict dangerous imports
  if (code.includes('import os') || code.includes('import sys') || code.includes('subprocess') ||
    code.includes('import shutil') || code.includes('import socket')) {
    onOutput(undefined, 'Error: Restricted import detected. System modules are not allowed for security reasons.');
    return;
  }

  const tempFile = join(tmpdir(), `code_${Date.now()}.py`);

  try {
    await writeFile(tempFile, code);

    const python = spawn('python3', [tempFile], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000, // 10 second timeout
      uid: process.getuid?.(), // Run as current user
      gid: process.getgid?.(), // Run as current group
      env: { ...process.env, PYTHONPATH: '' }, // Clean environment
    });

    python.stdout.on('data', (data) => {
      onOutput(data.toString());
    });

    python.stderr.on('data', (data) => {
      onOutput(undefined, data.toString());
    });

    await new Promise<void>((resolve, reject) => {
      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Execution failed'));
        }
      });

      python.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    onOutput(undefined, `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function executeCStreaming(
  code: string,
  onOutput: (output?: string, error?: string) => void
): Promise<void> {
  if (!code.trim()) {
    onOutput(undefined, 'Empty code provided');
    return;
  }

  if (!code.includes('int main')) {
    onOutput(undefined, 'Compilation Error: undefined reference to `main`\nError: main function not found');
    return;
  }

  if (!code.includes('#include')) {
    onOutput(undefined, 'Compilation Error: Missing required header files');
    return;
  }

  const sourceFile = join(tmpdir(), `code_${Date.now()}.c`);
  const exeFile = join(tmpdir(), `code_${Date.now()}`);

  try {
    await writeFile(sourceFile, code);

    // Compile C code first
    const compileResult = await new Promise<boolean>((resolve, reject) => {
      const gcc = spawn('gcc', [sourceFile, '-o', exeFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
        uid: process.getuid?.(),
        gid: process.getgid?.(),
      });

      let error = '';

      gcc.stderr.on('data', (data) => {
        error += data.toString();
      });

      gcc.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(error || 'Compilation failed'));
        }
      });

      gcc.on('error', (err) => {
        reject(err);
      });
    });

    if (!compileResult) {
      throw new Error('Compilation failed');
    }

    // Execute the compiled program
    const program = spawn(exeFile, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
      uid: process.getuid?.(),
      gid: process.getgid?.(),
    });

    program.stdout.on('data', (data) => {
      onOutput(data.toString());
    });

    program.stderr.on('data', (data) => {
      onOutput(undefined, data.toString());
    });

    await new Promise<void>((resolve, reject) => {
      program.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Execution failed'));
        }
      });

      program.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    onOutput(undefined, `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Clean up temp files
    try {
      await unlink(sourceFile);
      await unlink(exeFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function executeC(code: string): Promise<{ success: boolean; output?: string; error?: string }> {
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

  const sourceFile = join(tmpdir(), `code_${Date.now()}.c`);
  const exeFile = join(tmpdir(), `code_${Date.now()}`);

  try {
    await writeFile(sourceFile, code);

    // Compile C code
    const compileResult = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const gcc = spawn('gcc', [sourceFile, '-o', exeFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
        uid: process.getuid?.(),
        gid: process.getgid?.(),
      });

      let error = '';

      gcc.stderr.on('data', (data) => {
        error += data.toString();
      });

      gcc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: error || 'Compilation failed' });
        }
      });

      gcc.on('error', (err) => {
        resolve({ success: false, error: `Failed to start GCC: ${err.message}` });
      });
    });

    if (!compileResult.success) {
      return { success: false, error: compileResult.error };
    }

    // Execute the compiled program
    return new Promise((resolve) => {
      const program = spawn(exeFile, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });

      let output = '';
      let error = '';

      program.stdout.on('data', (data) => {
        output += data.toString();
      });

      program.stderr.on('data', (data) => {
        error += data.toString();
      });

      program.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: output || 'Program executed successfully (no output)' });
        } else {
          resolve({ success: false, error: error || 'Execution failed' });
        }
      });

      program.on('error', (err) => {
        resolve({ success: false, error: `Failed to execute program: ${err.message}` });
      });
    });
  } catch (error) {
    return { success: false, error: `File operation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  } finally {
    // Clean up temp files
    try {
      await unlink(sourceFile);
      await unlink(exeFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function executeCppStreaming(
  code: string,
  onOutput: (output?: string, error?: string) => void
): Promise<void> {
  if (!code.trim()) {
    onOutput(undefined, 'Empty code provided');
    return;
  }

  if (!code.includes('int main')) {
    onOutput(undefined, 'Compilation Error: undefined reference to `main`\nError: main function not found');
    return;
  }

  if (!code.includes('#include')) {
    onOutput(undefined, 'Compilation Error: Missing required header files');
    return;
  }

  const sourceFile = join(tmpdir(), `code_${Date.now()}.cpp`);
  const exeFile = join(tmpdir(), `code_${Date.now()}`);

  try {
    await writeFile(sourceFile, code);

    // Compile C++ code first
    const compileResult = await new Promise<boolean>((resolve, reject) => {
      const gpp = spawn('g++', [sourceFile, '-o', exeFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
        uid: process.getuid?.(),
        gid: process.getgid?.(),
      });

      let error = '';

      gpp.stderr.on('data', (data) => {
        error += data.toString();
      });

      gpp.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(error || 'Compilation failed'));
        }
      });

      gpp.on('error', (err) => {
        reject(err);
      });
    });

    if (!compileResult) {
      throw new Error('Compilation failed');
    }

    // Execute the compiled program
    const program = spawn(exeFile, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
      uid: process.getuid?.(),
      gid: process.getgid?.(),
    });

    program.stdout.on('data', (data) => {
      onOutput(data.toString());
    });

    program.stderr.on('data', (data) => {
      onOutput(undefined, data.toString());
    });

    await new Promise<void>((resolve, reject) => {
      program.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Execution failed'));
        }
      });

      program.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    onOutput(undefined, `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Clean up temp files
    try {
      await unlink(sourceFile);
      await unlink(exeFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function executeCpp(code: string): Promise<{ success: boolean; output?: string; error?: string }> {
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

  const sourceFile = join(tmpdir(), `code_${Date.now()}.cpp`);
  const exeFile = join(tmpdir(), `code_${Date.now()}`);

  try {
    await writeFile(sourceFile, code);

    // Compile C++ code
    const compileResult = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const gpp = spawn('g++', [sourceFile, '-o', exeFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
        uid: process.getuid?.(),
        gid: process.getgid?.(),
      });

      let error = '';

      gpp.stderr.on('data', (data) => {
        error += data.toString();
      });

      gpp.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: error || 'Compilation failed' });
        }
      });

      gpp.on('error', (err) => {
        resolve({ success: false, error: `Failed to start G++: ${err.message}` });
      });
    });

    if (!compileResult.success) {
      return { success: false, error: compileResult.error };
    }

    // Execute the compiled program
    return new Promise((resolve) => {
      const program = spawn(exeFile, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });

      let output = '';
      let error = '';

      program.stdout.on('data', (data) => {
        output += data.toString();
      });

      program.stderr.on('data', (data) => {
        error += data.toString();
      });

      program.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: output || 'Program executed successfully (no output)' });
        } else {
          resolve({ success: false, error: error || 'Execution failed' });
        }
      });

      program.on('error', (err) => {
        resolve({ success: false, error: `Failed to execute program: ${err.message}` });
      });
    });
  } catch (error) {
    return { success: false, error: `File operation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  } finally {
    // Clean up temp files
    try {
      await unlink(sourceFile);
      await unlink(exeFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function executeJavaStreaming(
  code: string,
  onOutput: (output?: string, error?: string) => void
): Promise<void> {
  if (!code.trim()) {
    onOutput(undefined, 'Empty code provided');
    return;
  }

  if (!code.includes('class')) {
    onOutput(undefined, 'Compilation Error: class, interface, or enum expected');
    return;
  }

  if (!code.includes('public static void main')) {
    onOutput(undefined, 'Error: Main method not found in class Main\nPlease define the main method as:\n   public static void main(String[] args)');
    return;
  }

  const sourceFile = join(tmpdir(), `Main_${Date.now()}.java`);
  const classFile = join(tmpdir(), 'Main.class');

  try {
    await writeFile(sourceFile, code);

    // Compile Java code first
    const compileResult = await new Promise<boolean>((resolve, reject) => {
      const javac = spawn('javac', [sourceFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
        uid: process.getuid?.(),
        gid: process.getgid?.(),
      });

      let error = '';

      javac.stderr.on('data', (data) => {
        error += data.toString();
      });

      javac.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(error || 'Compilation failed'));
        }
      });

      javac.on('error', (err) => {
        reject(err);
      });
    });

    if (!compileResult) {
      throw new Error('Compilation failed');
    }

    // Execute the compiled program
    const program = spawn('java', ['-cp', tmpdir(), 'Main'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });

    program.stdout.on('data', (data) => {
      onOutput(data.toString());
    });

    program.stderr.on('data', (data) => {
      onOutput(undefined, data.toString());
    });

    await new Promise<void>((resolve, reject) => {
      program.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Execution failed'));
        }
      });

      program.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    onOutput(undefined, `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Clean up temp files
    try {
      await unlink(sourceFile);
      await unlink(classFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function executeJava(code: string): Promise<{ success: boolean; output?: string; error?: string }> {
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

  const sourceFile = join(tmpdir(), `Main_${Date.now()}.java`);
  const classFile = join(tmpdir(), 'Main.class');

  try {
    await writeFile(sourceFile, code);

    // Compile Java code
    const compileResult = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const javac = spawn('javac', [sourceFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
        uid: process.getuid?.(),
        gid: process.getgid?.(),
      });

      let error = '';

      javac.stderr.on('data', (data) => {
        error += data.toString();
      });

      javac.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: error || 'Compilation failed' });
        }
      });

      javac.on('error', (err) => {
        resolve({ success: false, error: `Failed to start javac: ${err.message}` });
      });
    });

    if (!compileResult.success) {
      return { success: false, error: compileResult.error };
    }

    // Execute the compiled program
    return new Promise((resolve) => {
      const program = spawn('java', ['-cp', tmpdir(), 'Main'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
        uid: process.getuid?.(),
        gid: process.getgid?.(),
      });

      let output = '';
      let error = '';

      program.stdout.on('data', (data) => {
        output += data.toString();
      });

      program.stderr.on('data', (data) => {
        error += data.toString();
      });

      program.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: output || 'Program executed successfully (no output)' });
        } else {
          resolve({ success: false, error: error || 'Execution failed' });
        }
      });

      program.on('error', (err) => {
        resolve({ success: false, error: `Failed to execute program: ${err.message}` });
      });
    });
  } catch (error) {
    return { success: false, error: `File operation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  } finally {
    // Clean up temp files
    try {
      await unlink(sourceFile);
      await unlink(classFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
