'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight } from '@geist-ui/icons';

export default function TuringMachine() {
    const [input, setInput] = useState('');
    const [tape, setTape] = useState([]);
    const [head, setHead] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState([]);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');
    const [speed, setSpeed] = useState(500); // animation speed in ms
    const [isPlaying, setIsPlaying] = useState(true);
    const [binaryResult, setBinaryResult] = useState('');
    const [currentState, setCurrentState] = useState(0);
    const [activeTransition, setActiveTransition] = useState(null);

    const handleRun = async () => {
        try {
            setError('');
            setRunning(true);
            setTape([]);
            setHead(null);
            setSteps([]);
            setCurrentStep(0);
            setBinaryResult('');
            setIsPlaying(true);
            setCurrentState(0);
            setActiveTransition(null);

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
                setCurrentState(initialStep.state);
                extractBinaryResult(initialStep.tape);
                setActiveTransition(null); // Start with no highlighted transition
            }

            setRunning(false);
            playAnimation();
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
            setCurrentState(initialStep.state);
            extractBinaryResult(initialStep.tape);
            setActiveTransition(null); // Clear any active transition on reset
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

    // Determine which transition is active based on current state and read symbol
    const determineActiveTransition = (state, tapeStr, headPos) => {
        // Only calculate new transitions on odd-numbered steps
        // On even steps, we keep the previous highlight
        if (currentStep % 2 === 1) {
            // Skip setting a new active transition on odd steps
            // but don't clear existing one - this keeps previous highlight
            return;
        }

        if (headPos === null || headPos < 0 || headPos >= tapeStr.length) {
            setActiveTransition(null);
            return;
        }

        const readSymbol = tapeStr[headPos];

        // Define transitions based on the state diagram
        // Format: [from_state, read_symbol, to_state, transition_id]
        const transitions = [
            // q0 transitions
            [0, '1', 1, 'q0-to-q1'],      // q0 -> q1 when reading '1'
            [0, 'X', 0, 'q0-self-top'],   // q0 -> q0 when reading 'X'
            [0, 'D', 0, 'q0-self-bottom'], // q0 -> q0 when reading 'D'
            [0, 'B', 2, 'q0-to-q2'],      // q0 -> q2 when reading 'B'

            // q1 transitions
            [1, 'X', 1, 'q1-self-top'],   // q1 -> q1 when reading 'X'
            [1, 'B', 0, 'q1-to-q0-upper'], // q1 -> q0 when reading 'B'
            [1, 'C', 1, 'q1-self-bottom'], // q1 -> q1 when reading 'C'
            [1, 'D', 0, 'q1-to-q0-lower'], // q1 -> q0 when reading 'D'
        ];

        for (const [fromState, symbol, toState, id] of transitions) {
            if (state === fromState && readSymbol === symbol) {
                setActiveTransition(id);
                return;
            }
        }

        setActiveTransition(null);
    };

    // Update tape and head position when current step changes
    useEffect(() => {
        if (steps.length > 0 && currentStep < steps.length) {
            const step = steps[currentStep];
            setTape(step.tape.split(''));
            setHead(step.headIndex);
            setCurrentState(step.state);
            extractBinaryResult(step.tape);
            determineActiveTransition(step.state, step.tape, step.headIndex);
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
            <h1 className="text-4xl mt-10 font-bold mb-6 text-center">Turing Machine: Unary to Binary </h1>

            <div className="mb-6">
                <div className="flex items-center mt-14 gap-2 border border-gray-300 rounded-4xl px-3 py-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value.replace(/[^1]/g, ''))}
                        disabled={running}
                        placeholder="Enter a Unary Number (11, 111, 1111, etc)"
                        className=" text-2xl border focus:outline-none focus:ring-0 focus:border-zinc-900 border-zinc-900 px-2 py-2 flex-grow mb-"
                    />

                    <button
                        onClick={handleRun}
                        disabled={running || !input || !/^[1]+$/.test(input)}
                        className={`px-3 py-3 cursor-pointer rounded-[1.3rem] ${running || !input || !/^[1]+$/.test(input)
                            ? 'bg-white'
                            : 'bg-white'
                            } text-black font-bold`}
                    >
                        {running ? <ArrowUpRight color="black" size={25} /> : <ArrowUpRight color="black" size={25} />}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            {steps.length > 0 && (
                <>
                    <div className="mt-16 mb-8">
                        <h2 className="text-lg font-semibold mb-2">Turing Machine Tape</h2>
                        <div className="relative overflow-x-hidden overflow-y-hidden scrollbar-hide pb-6">
                            <div className="flex gap-1">
                                {tape.map((symbol, index) => (
                                    <div
                                        key={index}
                                        className={`w-10 h-10 border rounded-md border-zinc-900 flex items-center justify-center font-mono text-white text-2xl relative ${head === index ? 'bg-orange-600' : 'bg-zinc-800'
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

                    <div style={{ display: 'flex', flexDirection: 'row' }}>

                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4">State Diagram</h2>
                            <div className="relative w-full h-96 bg-zinc-800 rounded-lg p-4 flex items-center justify-center">
                                <svg className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320">
                                    {/* Arrowhead marker definition */}
                                    <defs>
                                        <marker
                                            id="arrowhead"
                                            markerWidth="10"
                                            markerHeight="7"
                                            refX="9"
                                            refY="3.5"
                                            orient="auto"
                                        >
                                            <polygon points="0 0, 10 3.5, 0 7" fill="white" />
                                        </marker>
                                        <marker
                                            id="arrowhead-active"
                                            markerWidth="10"
                                            markerHeight="7"
                                            refX="9"
                                            refY="3.5"
                                            orient="auto"
                                        >
                                            <polygon points="0 0, 10 3.5, 0 7" fill="#FF5733" />
                                        </marker>
                                    </defs>

                                    {/* State Circles */}
                                    <circle
                                        cx="150"
                                        cy="120"
                                        r="40"
                                        fill={currentState === 0 ? "#4B5563" : "#374151"}
                                        stroke={currentState === 0 ? "white" : "none"}
                                        strokeWidth="3"
                                    />
                                    <text x="150" y="125" textAnchor="middle" className="fill-white font-bold text-lg">q0</text>

                                    <circle
                                        cx="350"
                                        cy="120"
                                        r="40"
                                        fill={currentState === 1 ? "#4B5563" : "#374151"}
                                        stroke={currentState === 1 ? "white" : "none"}
                                        strokeWidth="3"
                                    />
                                    <text x="350" y="125" textAnchor="middle" className="fill-white font-bold text-lg">q1</text>

                                    <circle
                                        cx="280"
                                        cy="230"
                                        r="40"
                                        fill={currentState === 2 ? "#4B5563" : "#374151"}
                                        stroke={currentState === 2 ? "white" : "none"}
                                        strokeWidth="3"
                                    />
                                    <text x="280" y="235" textAnchor="middle" className="fill-white font-bold text-lg">q2</text>

                                    {/* q0 to q1 transition */}
                                    <path
                                        id="q0-to-q1"
                                        d="M 190 120 L 310 120"
                                        stroke={activeTransition === "q0-to-q1" ? "#FF5733" : "white"}
                                        strokeWidth={activeTransition === "q0-to-q1" ? "3" : "2"}
                                        fill="none"
                                        markerEnd={activeTransition === "q0-to-q1" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                    <text x="250" y="114" textAnchor="middle" className={`text-sm font-medium ${activeTransition === "q0-to-q1" ? "fill-orange-400" : "fill-white"}`}>1,X,L</text>

                                    {/* q1 to q0 - upper transition */}
                                    <path
                                        id="q1-to-q0-upper"
                                        d="M 310 100 L 190 100"
                                        stroke={activeTransition === "q1-to-q0-upper" ? "#FF5733" : "white"}
                                        strokeWidth={activeTransition === "q1-to-q0-upper" ? "3" : "2"}
                                        fill="none"
                                        markerEnd={activeTransition === "q1-to-q0-upper" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                    <text x="250" y="95" textAnchor="middle" className={`text-sm font-medium ${activeTransition === "q1-to-q0-upper" ? "fill-orange-400" : "fill-white"}`}>B,C,R</text>

                                    {/* q1 to q0 - lower transition */}
                                    <path
                                        id="q1-to-q0-lower"
                                        d="M 310 140 L 190 140"
                                        stroke={activeTransition === "q1-to-q0-lower" ? "#FF5733" : "white"}
                                        strokeWidth={activeTransition === "q1-to-q0-lower" ? "3" : "2"}
                                        fill="none"
                                        markerEnd={activeTransition === "q1-to-q0-lower" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                    <text x="250" y="135" textAnchor="middle" className={`text-sm font-medium ${activeTransition === "q1-to-q0-lower" ? "fill-orange-400" : "fill-white"}`}>D,C,R</text>

                                    {/* q0 to q2 */}
                                    <path
                                        id="q0-to-q2"
                                        d="M 170 150 C 190 200 220 220 235 225"
                                        stroke={activeTransition === "q0-to-q2" ? "#FF5733" : "white"}
                                        strokeWidth={activeTransition === "q0-to-q2" ? "3" : "2"}
                                        fill="none"
                                        markerEnd={activeTransition === "q0-to-q2" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                    <text x="200" y="185" className={`text-sm font-medium ${activeTransition === "q0-to-q2" ? "fill-orange-400" : "fill-white"}`}>B,B,L</text>

                                    {/* q0 self-loop - top */}
                                    <path
                                        id="q0-self-top"
                                        d="M 125 90 C 105 65 145 40 175 70"
                                        stroke={activeTransition === "q0-self-top" ? "#FF5733" : "white"}
                                        strokeWidth={activeTransition === "q0-self-top" ? "3" : "2"}
                                        fill="none"
                                        markerEnd={activeTransition === "q0-self-top" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                    <text x="120" y="48" className={`text-sm font-medium ${activeTransition === "q0-self-top" ? "fill-orange-400" : "fill-white"}`}>X,X,R</text>

                                    {/* q0 self-loop - bottom */}
                                    <path
                                        id="q0-self-bottom"
                                        d="M 125 150 C 105 175 145 200 175 170"
                                        stroke={activeTransition === "q0-self-bottom" ? "#FF5733" : "white"}
                                        strokeWidth={activeTransition === "q0-self-bottom" ? "3" : "2"}
                                        fill="none"
                                        markerEnd={activeTransition === "q0-self-bottom" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                    <text x="120" y="200" className={`text-sm font-medium ${activeTransition === "q0-self-bottom" ? "fill-orange-400" : "fill-white"}`}>D,D,R</text>

                                    {/* q1 self-loop - top */}
                                    <path
                                        id="q1-self-top"
                                        d="M 375 90 C 395 65 355 40 325 70"
                                        stroke={activeTransition === "q1-self-top" ? "#FF5733" : "white"}
                                        strokeWidth={activeTransition === "q1-self-top" ? "3" : "2"}
                                        fill="none"
                                        markerEnd={activeTransition === "q1-self-top" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                    <text x="375" y="55" className={`text-sm font-medium ${activeTransition === "q1-self-top" ? "fill-orange-400" : "fill-white"}`}>X,X,L</text>

                                    {/* q1 self-loop - bottom */}
                                    <path
                                        id="q1-self-bottom"
                                        d="M 375 150 C 395 175 355 200 325 170"
                                        stroke={activeTransition === "q1-self-bottom" ? "#FF5733" : "white"}
                                        strokeWidth={activeTransition === "q1-self-bottom" ? "3" : "2"}
                                        fill="none"
                                        markerEnd={activeTransition === "q1-self-bottom" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                    <text x="375" y="190" className={`text-sm font-medium ${activeTransition === "q1-self-bottom" ? "fill-orange-400" : "fill-white"}`}>C,D,L</text>
                                </svg>

                                {activeTransition && (
                                    <div className="absolute bottom-4 left-4 text-sm bg-orange-700 px-3 py-1 rounded-md">
                                        <div>Active Transition: {activeTransition}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="mb-8">
                                <h2 className="ml-4 text-lg font-semibold mb-2">Result</h2>
                                <div className="mt-4 ml-4 bg-zinc-800 p-4 rounded-lg">
                                    <div>
                                        <span className="font-medium">Binary Output:</span>{" "}
                                        <span className="font-mono">{binaryResult}</span>
                                    </div>
                                </div>
                                <div className="ml-5 my-10 flex items-center gap-4 mb-2">
                                    <h2 className="mt-2 text-lg font-semibold">Current State</h2>
                                </div>
                                <div className="mt-2 ml-4 text-sm bg-zinc-800 px-4 py-4 rounded-lg">
                                    <div> q{currentState}</div>
                                </div>
                                <div className=" ml-4 mb-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="mt-10 text-lg font-semibold">Animation Controls</h2>
                                    </div>
                                    <div className="mb-3 text-sm text-gray-600">
                                        Step {currentStep + 1} of {steps.length}
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={resetAnimation}
                                            className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={stepBackward}
                                            disabled={currentStep === 0}
                                            className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg"
                                        >
                                            Prev
                                        </button>
                                        {isPlaying ? (
                                            <button
                                                onClick={pauseAnimation}
                                                className="bg-white hover:bg-zinc-700 px-3 py-1 rounded-lg text-black"
                                            >
                                                Pause
                                            </button>
                                        ) : (
                                            <button
                                                onClick={playAnimation}
                                                className="bg-white hover:bg-zinc-700 px-3 py-1 rounded-lg text-black"
                                            >
                                                Play
                                            </button>
                                        )}
                                        <button
                                            onClick={stepForward}
                                            disabled={currentStep === steps.length - 1}
                                            className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg"
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
                                            className="w-32 "
                                            style={{ accentColor: '#949494FF' }}
                                        />
                                        <span className="text-sm">{speed}ms</span>
                                    </div>

                                </div>

                            </div>

                        </div>


                    </div>



                    <div className="">


                        <div className="mb-4">
                            <h2 className="text-lg font-semibold mb-2">Legend</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-zinc-800 p-4 rounded-2xl">
                                    <h3 className="font-medium mb-2">Tape Symbols</h3>
                                    <ul className="space-y-1">
                                        <li><span className="font-mono">1</span> - Unary input digit</li>
                                        <li><span className="font-mono">X</span> - Processed unary digit</li>
                                        <li><span className="font-mono">B</span> - Blank space</li>
                                        <li><span className="font-mono">C</span> - Binary 1</li>
                                        <li><span className="font-mono">D</span> - Binary 0</li>
                                    </ul>
                                </div>

                                <div className="bg-zinc-800 p-4 rounded-2xl">
                                    <h3 className="font-medium mb-2">State Transition Table</h3>
                                    <p className="">Each transition shows (Read, Write, Move)</p>
                                    <p className="">L = Left, R = Right</p>
                                    <div className="mt-2">
                                        <span className="inline-block w-4 h-4 bg-orange-600 rounded-full mr-2"></span>
                                        <span>Highlighted transitions show current active path</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}