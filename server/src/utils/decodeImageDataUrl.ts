import { ApiError } from "../middlewares/errorHandler.js";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_BASE64_LENGTH = 4 * Math.ceil(MAX_IMAGE_BYTES / 3);
const MAX_IMAGE_SIDE = 4096;
const MAX_IMAGE_PIXELS = 12_000_000;

const isPng = (file: Buffer) =>
  file.length >= 24 &&
  file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) &&
  file.readUInt32BE(8) === 13 &&
  file.toString("ascii", 12, 16) === "IHDR";

const isJpeg = (file: Buffer) =>
  file.length >= 4 &&
  file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff &&
  file[file.length - 2] === 0xff && file[file.length - 1] === 0xd9;

const imageDimensions = (file: Buffer, mime: string): [number, number] | null => {
  if (mime === "image/png" && file.length >= 24) return [file.readUInt32BE(16), file.readUInt32BE(20)];

  if (mime === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < file.length) {
      if (file[offset] !== 0xff) { offset += 1; continue; }
      while (file[offset] === 0xff) offset += 1;
      const marker = file[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (offset + 7 >= file.length) return null;
        return [file.readUInt16BE(offset + 5), file.readUInt16BE(offset + 3)];
      }
      if (offset + 2 > file.length) return null;
      const segmentLength = file.readUInt16BE(offset);
      if (segmentLength < 2) return null;
      offset += segmentLength;
    }
    return null;
  }

  if (mime === "image/webp" && file.length >= 25) {
    const chunk = file.toString("ascii", 12, 16);
    if (chunk === "VP8X" && file.length >= 30) {
      const width = 1 + file.readUIntLE(24, 3);
      const height = 1 + file.readUIntLE(27, 3);
      return [width, height];
    }
    if (chunk === "VP8 " && file.length >= 30 && file[23] === 0x9d && file[24] === 0x01 && file[25] === 0x2a) {
      return [file.readUInt16LE(26) & 0x3fff, file.readUInt16LE(28) & 0x3fff];
    }
    if (chunk === "VP8L" && file[20] === 0x2f && file.length >= 25) {
      const width = 1 + file[21] + ((file[22] & 0x3f) << 8);
      const height = 1 + ((file[22] & 0xc0) >> 6) + (file[23] << 2) + ((file[24] & 0x0f) << 10);
      return [width, height];
    }
  }
  return null;
};

const isSafeImageSize = (dimensions: [number, number] | null) => {
  if (!dimensions) return false;
  const [width, height] = dimensions;
  return width > 0 && height > 0 && width <= MAX_IMAGE_SIDE && height <= MAX_IMAGE_SIDE && width * height <= MAX_IMAGE_PIXELS;
};

const isWebp = (file: Buffer) =>
  file.length >= 20 &&
  file.toString("ascii", 0, 4) === "RIFF" &&
  file.toString("ascii", 8, 12) === "WEBP" &&
  file.readUInt32LE(4) === file.length - 8;

/* Eu explico: * Confere o formato declarado e a assinatura binária antes de enviar ao Storage. */
export const decodeImageDataUrl = (value: unknown) => {
  if (typeof value !== "string" || value.length > MAX_BASE64_LENGTH + 32) {
    throw new ApiError(400, "A imagem deve ter no máximo 3 MB.");
  }

  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw new ApiError(400, "Envie uma imagem PNG, JPG ou WebP válida.");

  const contentType = match[1];
  const encoded = match[2];
  if (encoded.length > MAX_BASE64_LENGTH) throw new ApiError(400, "A imagem deve ter no máximo 3 MB.");

  const file = Buffer.from(encoded, "base64");
  if (!file.length || file.length > MAX_IMAGE_BYTES || file.toString("base64") !== encoded) {
    throw new ApiError(400, "O conteúdo da imagem é inválido ou excede 3 MB.");
  }

  const valid = contentType === "image/png" ? isPng(file)
    : contentType === "image/jpeg" ? isJpeg(file)
      : isWebp(file);
  if (!valid) throw new ApiError(400, "O conteúdo não corresponde a uma imagem PNG, JPG ou WebP válida.");
  if (!isSafeImageSize(imageDimensions(file, contentType))) {
    throw new ApiError(400, "A imagem precisa ter até 4096 px por lado e no máximo 12 megapixels.");
  }

  return {
    contentType,
    extension: contentType === "image/jpeg" ? "jpg" : contentType.slice("image/".length),
    file,
  };
};
