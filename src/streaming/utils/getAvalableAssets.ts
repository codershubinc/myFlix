import { spawn } from 'child_process';


export async function getAvailableAssets(directory: string): Promise<string[]> {
    try {
        // Check if directory exists
        await checkDirectoryExists(directory);

        // List all video files
        const videoFiles = await findVideoFiles(directory);
        return videoFiles;

    } catch (error) {
        console.error(`Error getting available assets: ${error}`);
        throw error;
    }
}

function checkDirectoryExists(directory: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const dir = spawn('test', ['-d', directory]);

        dir.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Directory exists: ${directory}`);
                resolve();
            } else {
                reject(new Error(`Directory ${directory} does not exist.`));
            }
        });

        dir.on('error', (error) => {
            reject(new Error(`Error checking directory: ${error.message}`));
        });
    });
}

function findVideoFiles(directory: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        // Correct find command for multiple file types
        const find = spawn('find', [
            directory,
            '-type', 'f',
            '(',
            '-name', '*.mkv',
            ')',
        ]);

        const availableAssets: string[] = [];
        let errorOutput = '';

        find.stdout.on('data', (data) => {
            const files = data.toString().split('\n').filter(Boolean).map(file => 'http://192.168.1.108:3000/stream/movies/stream?path=' + file);
            availableAssets.push(...files);
        });

        find.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        find.on('close', (code) => {
            if (code === 0) {
                console.log(`📁 Found ${availableAssets.length} video files`);
                resolve(availableAssets.sort());
            } else {
                reject(new Error(`Failed to list files: ${errorOutput}`));
            }
        });

        find.on('error', (error) => {
            reject(new Error(`Find process error: ${error.message}`));
        });
    });
}