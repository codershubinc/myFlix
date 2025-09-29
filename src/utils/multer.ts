import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
// Middleware to set uploadPath and customFilename from query/body before Multer runs
export function setUploadMeta(req, res, next) {
    req.uploadPath = req.query.path || req.body?.path || '/home/swap/Github/video-streaming-app/uploads';
    req.customFilename = req.query.title || req.body?.title || 'untitled';
    (req as any).uploadPath = req.query.path || req.body?.path || '/home/swap/Github/video-streaming-app/uploads';
    (req as any).customFilename = req.query.title || req.body?.title || 'untitled';
    next();
}

export function MulterUploadInterceptor(fieldName = 'file') {
    try {
        return FileInterceptor(fieldName, {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    console.log('body', req.body);
                    
                    const uploadPath = (req as any).uploadPath || 'uploads'; 
                    try {
                        mkdirSync(uploadPath, { recursive: true });
                        cb(null, uploadPath);
                    } catch (error) {
                        cb(error as Error, uploadPath);
                    }
                },
                filename: (req: any, file, cb) => {
                    cb(null, req.customFilename || file.originalname);
                    cb(null, (req as any).customFilename || file.originalname);
                },
            }),
            limits: {
                fileSize: 1024 * 1024 * 1024 * 10, // 10GB
            },
        });
    } catch (error) {
        console.error('Error creating multer upload interceptor:', error);
        throw error;
    }
}