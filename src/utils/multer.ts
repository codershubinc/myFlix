import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';

export function MulterUploadInterceptor(fieldName = 'file', ...args: any) {
    return FileInterceptor(fieldName, {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = 'uploads';
                try {
                    mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                } catch (error) {
                    cb(error as Error, uploadPath);
                }
            },
            filename: (req, file, cb) => {
                cb(null, file.originalname);
            },
        }),
        limits: {
            fileSize: 1024 * 1024 * 1024 * 10, // 10GB
        },
    });
}