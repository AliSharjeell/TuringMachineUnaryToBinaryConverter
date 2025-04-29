'use client';

import { useState, useEffect } from 'react';

export default function TuringMachine() {
    const [input, setInput] = useState('');
    const [tape, setTape] = useState([]);
    const [head, setHead] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState([]);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');
    const [speed, setSpeed] = useState(500); // animation speed in ms
    const [isPlaying, setIsPlaying] = useState(false);
    const [binaryResult, setBinaryResult] = useState('');

    const handleRun = async () => {
        try {
            setError('');
            setRunning(true);
            setTape([]);
            setHead(null);
            setSteps([]);
            setCurrentStep(0);
            setBinaryResult('');
            setIsPlaying(false);

            // Send unary input to the backend
            const res = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unary: input }),
            });

            const data = await res.json();

            if (res.status !== 200 || !Array.isArray(data)) {
                throw new Error(data.error || 'Failed to process input');
            }

            setSteps(data);

            // Show initial state
            if (data.length > 0) {
                const initialStep = data[0];
                setTape(initialStep.tape.split(''));
                setHead(initialStep.headIndex);
                extractBinaryResult(initialStep.tape);
            }

            setRunning(false);
        } catch (err) {
            setError(err.message || 'An error occurred');
            setRunning(false);
        }
    };

    const playAnimation = () => {
        if (currentStep >= steps.length - 1) {
            setCurrentStep(0);
        }
        setIsPlaying(true);
    };

    const pauseAnimation = () => {
        setIsPlaying(false);
    };

    const resetAnimation = () => {
        setIsPlaying(false);
        setCurrentStep(0);
        if (steps.length > 0) {
            const initialStep = steps[0];
            setTape(initialStep.tape.split(''));
            setHead(initialStep.headIndex);
            extractBinaryResult(initialStep.tape);
        }
    };

    const stepForward = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const stepBackward = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Extract binary representation from tape
    const extractBinaryResult = (tapeString) => {
        // Find consecutive C/D sequence (binary representation)
        let binaryStr = '';
        let foundBinary = false;

        for (let i = 0; i < tapeString.length; i++) {
            if (tapeString[i] === 'C' || tapeString[i] === 'D') {
                // C = 0, D = 1 in binary
                binaryStr += tapeString[i] === 'C' ? '1' : '0';
                foundBinary = true;
            } else if (foundBinary) {
                break;
            }
        }

        // If we found a binary representation, update the state
        if (binaryStr) {
            setBinaryResult(binaryStr);
        }
    };

    // Update tape and head position when current step changes
    useEffect(() => {
        if (steps.length > 0 && currentStep < steps.length) {
            const step = steps[currentStep];
            setTape(step.tape.split(''));
            setHead(step.headIndex);
            extractBinaryResult(step.tape);
        }
    }, [currentStep, steps]);

    // Animation loop
    useEffect(() => {
        let animationTimer;

        if (isPlaying && currentStep < steps.length - 1) {
            animationTimer = setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, speed);
        } else if (isPlaying && currentStep >= steps.length - 1) {
            setIsPlaying(false);
        }

        return () => clearTimeout(animationTimer);
    }, [isPlaying, currentStep, steps, speed]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Unary to Binary Turing Machine</h1>

            <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                    Enter unary input (sequence of 1's) to convert to binary
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value.replace(/[^1]/g, ''))}
                        disabled={running}
                        placeholder="Enter unary input like 11 or 111"
                        className="border border-gray-300 rounded px-3 py-2 flex-grow"
                    />
                    <button
                        onClick={handleRun}
                        disabled={running || !input || !/^[1]+$/.test(input)}
                        className={`px-4 py-2 rounded ${running || !input || !/^[1]+$/.test(input)
                            ? 'bg-gray-400'
                            : 'bg-blue-600 hover:bg-blue-700'
                            } text-white font-medium`}
                    >
                        {running ? 'Processing...' : 'Run Machine'}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            {steps.length > 0 && (
                <>
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-lg font-semibold">Animation Controls</h2>
                            <div className="text-sm text-gray-600">
                                Step {currentStep + 1} of {steps.length}
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={resetAnimation}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                            >
                                Reset
                            </button>
                            <button
                                onClick={stepBackward}
                                disabled={currentStep === 0}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
                            >
                                Prev
                            </button>
                            {isPlaying ? (
                                <button
                                    onClick={pauseAnimation}
                                    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-white"
                                >
                                    Pause
                                </button>
                            ) : (
                                <button
                                    onClick={playAnimation}
                                    className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-white"
                                >
                                    Play
                                </button>
                            )}
                            <button
                                onClick={stepForward}
                                disabled={currentStep === steps.length - 1}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm">Speed:</span>
                            <input
                                type="range"
                                min="100"
                                max="2000"
                                step="100"
                                value={speed}
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                className="w-32"
                            />
                            <span className="text-sm">{speed}ms</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-2">Turing Machine Tape</h2>
                        <div className="relative overflow-x-auto pb-6">
                            <div className="flex gap-1">
                                {tape.map((symbol, index) => (
                                    <div
                                        key={index}
                                        className={`w-10 h-10 border border-gray-400 flex items-center justify-center font-mono text-lg relative ${head === index ? 'bg-yellow-200' : 'bg-white'
                                            }`}
                                    >
                                        {symbol}
                                        <div className="absolute -bottom-6 text-xs text-gray-500">{index}</div>
                                    </div>
                                ))}
                            </div>
                            {head !== null && (
                                <div
                                    className="absolute top-full left-0 h-4 w-0 border-l-2 border-red-500"
                                    style={{ left: `${head * 2.5 + 1.25}rem` }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-2">Result</h2>
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="mb-2">
                                <span className="font-medium">Unary Input:</span> {input}
                            </div>
                            <div>
                                <span className="font-medium">Binary Output:</span>{" "}
                                <span className="font-mono">{binaryResult}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h2 className="text-lg font-semibold mb-2">Legend</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <h3 className="font-medium mb-2">Tape Symbols</h3>
                                <ul className="space-y-1">
                                    <li><span className="font-mono">1</span> - Unary input digit</li>
                                    <li><span className="font-mono">X</span> - Processed unary digit</li>
                                    <li><span className="font-mono">B</span> - Blank space</li>
                                    <li><span className="font-mono">C</span> - Binary 1</li>
                                    <li><span className="font-mono">D</span> - Binary 0</li>
                                </ul>
                            </div>
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <h3 className="font-medium mb-2">How It Works</h3>
                                <p className="text-sm">
                                    This Turing machine converts unary numbers (sequence of 1's) to their binary
                                    representation. The machine processes each unary digit from left to right,
                                    marking it as processed and incrementing the binary counter accordingly.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}