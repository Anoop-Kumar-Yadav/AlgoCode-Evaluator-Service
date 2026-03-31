import { TestCase } from '../types/testCases';
import { JAVA_IMAGE } from '../utils/constants';
import createContainer from './containerFactory';
import decodeDockerStream from './dockerHelper';
import pullImage from './pullContainer';

async function runJava(code: string, inputData: TestCase) {
    const runCommand = `echo '${code.replace(/'/g, `\\"`)}' > Main.java && javac Main.java && echo ${inputData?.input} | java Main`;
    await pullImage(JAVA_IMAGE);
    const javaDockerContainer = await createContainer(JAVA_IMAGE, ['/bin/sh', '-c', runCommand]);

    try {
        await javaDockerContainer.start(); // booting container
        console.log('Started Docker container');

        // Wait for the container to finish running the code
        await javaDockerContainer.wait();

        const loggerStream = await javaDockerContainer.logs({
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
        await javaDockerContainer.remove({ force: true });
    }
}

export default runJava;

/* 

three separate Bash commands chained together with && (which means "only do the next step if the previous step succeeded"):

    echo '...' > Main.java: Writes the user's Java code into a file. (We use Main.java as the standard convention for code executors).

    javac Main.java: Invokes the Java Compiler to turn the human-readable code into a machine-readable Main.class file.

    echo ${inputData?.input} | java Main: Takes the test case input, pipes it into standard input (stdin), and executes the compiled Main class.
*/
