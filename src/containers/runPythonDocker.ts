import { TestCase } from '../types/testCases';
import { PYTHON_IMAGE } from '../utils/constants';
import createContainer from './containerFactory';
import decodeDockerStream from './dockerHelper';
import pullImage from './pullContainer';

async function runPython(code: string, inputData: TestCase) {
    const runCommand = `echo '${code.replace(/'/g, `\\"`)}' > test.py && echo ${inputData?.input} | python3 test.py`;

    await pullImage(PYTHON_IMAGE);
    const pythonDockerContainer = await createContainer(PYTHON_IMAGE, [
        '/bin/sh',
        '-c',
        runCommand,
    ]);

    try {
        await pythonDockerContainer.start(); // booting container
        console.log('Started Docker container');

        // Wait for the container to finish running the code
        await pythonDockerContainer.wait();

        const loggerStream = await pythonDockerContainer.logs({
            stdout: true,
            stderr: true,
            timestamps: false,
            follow: true, // whether the log are stream or return as a single string
        });

        await new Promise<void>((resolve, reject) => {
            const rawBuffer: Buffer[] = [];
            loggerStream.on('data', (chunk) => {
                rawBuffer.push(chunk);
            });
            loggerStream.on('end', () => {
                try {
                    const completeBuffer = Buffer.concat(rawBuffer);
                    const decodedStream = decodeDockerStream(completeBuffer);

                    // 1. Convert to string
                    // 2. .trim() removes the \n from Python's print() and any leading/trailing spaces
                    const actualOutput = decodedStream.stdout.toString().trim();
                    const expectedOutput = inputData.output.toString().trim();

                    console.log(
                        actualOutput === expectedOutput
                            ? `Test Passed: ${actualOutput}`
                            : `Test Failed: Unexpected output\nExpected: [${expectedOutput}]\nGot: [${actualOutput}]`,
                    );
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            loggerStream.on('error', (err) => {
                reject(err); // ❌ Catch stream errors
            });
        });
    } catch (error) {
        console.error('Execution failed:', error);
    } finally {
        // THE FIX: This block always runs, even if the code crashes.
        // It forcefully deletes the container from Docker Desktop!
        console.log('🧹 Cleaning up container...');
        await pythonDockerContainer.remove({ force: true });
    }
}

export default runPython;

/* 

Phase 1: The Blueprint (Lines 1 - 13)
    Before anything runs, Node.js needs to prepare the instructions.

    The Bash Trick (runCommand): You take the user's Python code and the test case input. Instead of saving a physical .py file to your server, you write a single string of Bash commands: 
        "Create a file called test.py in memory, put the code inside it, then pipe the input into the python3 command."

    The Blueprint (createContainer): You tell Dockerode to prepare a container using the PYTHON_IMAGE. You hand Docker the runCommand as the entry point.

        Important: At this stage, nothing is running yet. You have just built the engine; you haven't turned the key.

Phase 2: Ignition & Execution (Lines 15 - 22)
    Now, we enter the try block and start the engine.

    await pythonDockerContainer.start();: Node.js sends the "Turn the key" signal to Docker over the socket. Docker boots the isolated Linux environment. The Python script begins to execute.

    await pythonDockerContainer.wait();: Node.js asks Docker, "Let me know the exact millisecond the Python script finishes executing." Node.js pauses this function and waits.

        Once the Python script prints its final output and exits, Docker taps Node.js on the shoulder. Node.js wakes back up and moves to the next line.

Phase 3: The Data Hose (Lines 24 - 30)
    The Python code is finished, and the container is stopped (Exited state). But the output is still trapped inside Docker's internal log files.

    await pythonDockerContainer.logs(...): Node.js tells Docker, "Connect a hose to your internal log file and prepare to stream the data to me." Docker creates the loggerStream.

Phase 4: Harvesting the Data (Lines 32 - 59)
    This is the await new Promise(...) block. This is where Node.js sets up buckets to catch the water coming out of the hose.

    The Pause: Node.js puts the main function on hold again. It refuses to move to the finally block until this Promise resolves.

    The Collection (.on('data')): As Docker pumps data chunks through the hose, Node.js catches them and tosses them into the rawBuffer array.

    The Assembly (.on('end')): Docker signals, "The hose is empty." Node.js immediately:

        Smashes the chunks together (Buffer.concat).

        Strips away Docker's hidden headers (decodeDockerStream).

        Cleans up invisible newline characters (.trim()).

        Compares the actual output to the expected test case output.

    The Unlocking (resolve()): Node.js says, "I have successfully graded the test case. The Promise is fulfilled." This unlocks the main function, allowing it to move downward.

Phase 5: The Janitor (Lines 60 - 67)
    We finally reach the catch and finally blocks.

    The catch Block: If anything went wrong in Phases 2, 3, or 4 (e.g., Docker crashed, the stream broke), JavaScript jumps here to log the error.

    The finally Block: This is the most crucial part of the architecture. Whether the code passed, failed, or crashed, the finally block is guaranteed to run.

        await pythonDockerContainer.remove({ force: true });: Node.js tells Docker, "I have the data I need. Annihilate this container from the hard drive so my server doesn't run out of space."

*/
