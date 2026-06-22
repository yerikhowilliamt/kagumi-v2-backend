export class CloudinaryResponse {
  publicId: string;
  fileUrl: string;
  type: string;
  originalFilename: string;
  createdAt: string;
  updatedAt: string;

  constructor(params: {
    publicId: string;
    fileUrl: string;
    type: string;
    originalFilename: string;
    createdAt: string;
    updatedAt: string;
  }) {
    const { publicId, fileUrl, type, originalFilename, createdAt, updatedAt } =
      params;
    this.publicId = publicId;
    this.fileUrl = fileUrl;
    this.type = type;
    this.originalFilename = originalFilename;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
