import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class UploadsService {
  private readonly uploadPath = join(process.cwd(), 'uploads');

  getFilePath(filename: string): string {
    return join(this.uploadPath, filename);
  }

  deleteFile(filename: string): boolean {
    if (!filename) return false;

    const filePath = this.getFilePath(filename);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  getFileUrl(filename: string): string {
    if (!filename) return '';
    return `/uploads/${filename}`;
  }
}
