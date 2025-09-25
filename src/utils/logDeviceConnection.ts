import { writeFile, readFile } from 'fs';
import { join } from 'path';

const LOG_PATH = join(__dirname, '../../../device_connections.json');

/**
 * Logs device connection info to a JSON file for analytics.
 * For each IP, stores an array of deviceName and movieTitle objects.
 * @param ip Device IP address
 * @param deviceName Device name (user-agent)
 * @param movieTitle Title of the movie being streamed
 * @param time Connection time (string)
 */
export function logDeviceConnection(ip: string, deviceName: string, movieTitle: string, time: string) {
    readFile(LOG_PATH, 'utf8', (readErr, data) => {
        let logs: Record<string, Array<{ deviceName: string; movieTitle: string; time: string }>> = {};
        if (!readErr && data) {
            try {
                logs = JSON.parse(data);
            } catch (e) {
                logs = {};
            }
        }
        if (!logs[ip]) {
            logs[ip] = [];
        }
        // Only append if this deviceName/movieTitle/time is not already present for this IP
        const exists = logs[ip].some(
            entry => entry.deviceName === deviceName && entry.movieTitle === movieTitle && entry.time === time
        );
        if (!exists) {
            logs[ip].push({ deviceName, movieTitle, time });
        }
        writeFile(LOG_PATH, JSON.stringify(logs, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Failed to log device connection:', writeErr);
            }
        });
    });
}
