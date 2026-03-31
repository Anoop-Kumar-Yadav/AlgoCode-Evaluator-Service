/* eslint-disable @typescript-eslint/no-shadow */
import Docker from 'dockerode';

export async function checkImageExists(imageName: string): Promise<boolean> {
    try {
        const docker = new Docker();
        const image = docker.getImage(imageName);
        // inspect() queries the local Docker daemon for the image data
        const info = await image.inspect();

        console.log(
            `[Docker] Image '${imageName}' found locally. Size: ${(info.Size / 1024 / 1024).toFixed(2)} MB`,
        );
        return true;
    } catch (error: any) {
        if (error.statusCode === 404) {
            console.log(`[Docker] Image '${imageName}' not found locally.`);
            return false;
        }
        throw error;
    }
}

export default async function pullImage(imageName: string) {
    try {
        const exists = await checkImageExists(imageName);
        if (exists) {
            return;
        }
        return await new Promise((res, rej) => {
            const docker = new Docker();

            docker.pull(imageName, (err: Error, stream: NodeJS.ReadableStream) => {
                if (err) {
                    throw rej(err);
                }

                docker.modem.followProgress(
                    stream,
                    (err, response) => (err ? rej(err) : res(response)),
                    (event) => {
                        // 'event' contains detailed information about each layer being pulled
                        if (event.id) {
                            // If there's a progress bar available, print it. Otherwise, just print the status.
                            const progress = event.progress ? `- ${event.progress}` : '';
                            console.log(`[Layer ${event.id}] ${event.status} ${progress}`);
                        } else {
                            // General status updates (like "Pulling from library/python")
                            console.log(`[Docker] ${event.status}`);
                        }
                    },
                );
            });
        });
    } catch (error) {
        console.error('Failed to pull image:', error);
    }
}
