import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    folder = 'kagumi',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(new Error((error as { message?: string }).message));
          }
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Upload resulted in undefined response'));
          }
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  async destroyFile(publicId: string): Promise<unknown> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      const err = error as { message?: string };
      throw new Error(err.message || 'Failed to destroy file on Cloudinary');
    }
  }
}
