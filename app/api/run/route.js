import { execFile } from 'child_process';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { unary } = body;

    // Validate unary input
    if (!unary || !/^[1]+$/.test(unary)) {
      return NextResponse.json(
        { error: 'Invalid unary input (only 1s allowed)' },
        { status: 400 }
      );
    }

    // Execute the compiled binary with the unary input
    const result = await new Promise((resolve, reject) => {
      // Path to the compiled C++ binary
      const binaryPath = path.resolve(process.cwd(), './scripts/turing.exe');
      
      execFile(binaryPath, [unary], (error, stdout, stderr) => {
        if (error) {
          reject(stderr || 'Execution error');
          return;
        }
        
        try {
          // Parse JSON output
          const output = JSON.parse(stdout);
          resolve(output);
        } catch (parseError) {
          reject('Invalid JSON output from C++ program');
        }
      });
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error running Turing machine:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}