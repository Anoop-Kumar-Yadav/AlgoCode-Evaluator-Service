import Docker from 'dockerode';

async function createContainer(imageName: string, cmdExecutable: string[]) {
    const docker = new Docker();

    const container = await docker.createContainer({
        Image: imageName,
        Cmd: cmdExecutable,

        AttachStderr: true, // to enable input streams
        AttachStdin: true, // to enable output streams
        AttachStdout: true, // to enable error streams
        Tty: false,

        OpenStdin: true, // keep input stream open even when no interaction is there
    });

    return container;
}

export default createContainer;
