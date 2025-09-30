import fs from 'fs';

export const addFileToDisk = (
    file: Express.Multer.File,
    path: string,
    name: string
) => {
    try {
        if (!fs.existsSync(`${process.cwd()}/uploads${path}`)) {
            fs.mkdirSync(`${process.cwd()}/uploads${path}`, { recursive: true });
        }
        const newFilePath = `${process.cwd()}/uploads${path}/${name}.${file.originalname.split('.').pop()}`;
        return fs.renameSync(file.path, newFilePath);
    } catch (error) {
        console.error('Error adding file to disk:', error);
    }
}