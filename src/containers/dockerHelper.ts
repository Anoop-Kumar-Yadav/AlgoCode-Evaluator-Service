import DockerStreamOutput from '../types/dockerStreamOutput';
import { DOCKER_STREAM_HEADER_SIZE } from '../utils/constants';

export default function decodeDockerStream(buffer: Buffer): DockerStreamOutput {
    let offset = 0; // keeps track of current position in the buffer while parsing

    // it will store the accumulated stdout output as string
    const output: DockerStreamOutput = {
        stdout: '',
        stderr: '',
    };
    /* 
    type of stream   length of value                       
    [==============|==============][=========================================]
                HEADER                                      VALUE
    */
    // loop until offset reaches end of buffer
    while (offset < buffer.length) {
        // typeOfStream read from buffer HEADER and has value of type of stream
        const typeOfStream = buffer[offset];

        //  this length hold the length of the value
        // we will read this variable on  an offset of 4 bytes from start of chunk
        const length = buffer.readInt32BE(offset + 4);

        // AS WE NOW READ THE HEADER AND CAN MOVE TO THE VALUE
        offset += DOCKER_STREAM_HEADER_SIZE;

        if (typeOfStream === 1) {
            // stdout stream
            output.stdout += buffer.toString('utf-8', offset, offset + length);
        } else if (typeOfStream === 2) {
            // stderr stream
            output.stderr += buffer.toString('utf-8', offset, offset + length);
        }

        offset += length;
    }

    return output;
}
