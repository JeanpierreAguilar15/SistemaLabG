import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

const uploadPath = join(process.cwd(), 'uploads');

// Create uploads directory if it doesn't exist
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, callback) => {
          const uniqueName = `${uuid()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          callback(new Error('Solo se permiten imagenes (jpg, jpeg, png, gif, webp)'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
