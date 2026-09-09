<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\UploadedFile;

class ImageUploadService
{
    private const MIME_EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(
        private int $uploadMaxBytes,
        private int $uploadMaxPixels
    )
    {
        if ($this->uploadMaxBytes < 1 || $this->uploadMaxPixels < 1) {
            throw new \RuntimeException('Upload limits are invalid.');
        }
    }

    public function storeUploadedImage(UploadedFile $file, string $targetDir, string $publicPrefix): string
    {
        if (!$file->isValid()) {
            throw new \RuntimeException('Image upload failed.');
        }

        if ($file->getSize() === null || $file->getSize() > $this->uploadMaxBytes) {
            throw new \RuntimeException('Image is too large.');
        }

        $mime = $this->detectMime($file->getPathname());
        if (!isset(self::MIME_EXTENSIONS[$mime])) {
            throw new \RuntimeException('Unsupported image type.');
        }

        $dimensions = @getimagesize($file->getPathname());
        $this->validateDimensions($dimensions);

        $this->ensureDirectory($targetDir);
        $extension = self::MIME_EXTENSIONS[$mime];
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $targetPath = rtrim($targetDir, '/') . '/' . $filename;

        $this->rewriteImage($file->getPathname(), $targetPath, $mime);

        return rtrim($publicPrefix, '/') . '/' . $filename;
    }

    public function storeBase64Image(string $base64, string $targetDir, string $publicPrefix): string
    {
        $maxEncodedLength = 4 * (int) ceil($this->uploadMaxBytes / 3) + 64;
        if (strlen($base64) > $maxEncodedLength) {
            throw new \RuntimeException('Image is too large.');
        }

        if (!preg_match('/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+\/=\r\n]+)$/', $base64, $matches)) {
            throw new \RuntimeException('Invalid image payload.');
        }

        $binary = base64_decode($matches[2], true);
        if ($binary === false || strlen($binary) > $this->uploadMaxBytes) {
            throw new \RuntimeException('Image is too large.');
        }

        $tmp = tempnam(sys_get_temp_dir(), 'woofie_upload_');
        if ($tmp === false) {
            throw new \RuntimeException('Could not process image.');
        }

        try {
            if (file_put_contents($tmp, $binary) !== strlen($binary)) {
                throw new \RuntimeException('Could not process image.');
            }
            $mime = $this->detectMime($tmp);
            if ($mime !== $matches[1] || !isset(self::MIME_EXTENSIONS[$mime])) {
                throw new \RuntimeException('Unsupported image type.');
            }

            $dimensions = @getimagesize($tmp);
            $this->validateDimensions($dimensions);

            $this->ensureDirectory($targetDir);
            $filename = bin2hex(random_bytes(16)) . '.' . self::MIME_EXTENSIONS[$mime];
            $targetPath = rtrim($targetDir, '/') . '/' . $filename;
            $this->rewriteImage($tmp, $targetPath, $mime);

            return rtrim($publicPrefix, '/') . '/' . $filename;
        } finally {
            @unlink($tmp);
        }
    }

    private function detectMime(string $path): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        return (string) $finfo->file($path);
    }

    private function ensureDirectory(string $dir): void
    {
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new \RuntimeException('Upload directory is not writable.');
        }
    }

    private function rewriteImage(string $sourcePath, string $targetPath, string $mime): void
    {
        if (!function_exists('imagecreatefromstring')) {
            throw new \RuntimeException('Image processing extension is unavailable.');
        }

        $contents = file_get_contents($sourcePath);
        if ($contents === false) {
            throw new \RuntimeException('Could not read image.');
        }

        $image = @imagecreatefromstring($contents);
        if (!$image) {
            throw new \RuntimeException('Invalid image file.');
        }

        try {
            $saved = match ($mime) {
                'image/jpeg' => imagejpeg($image, $targetPath, 85),
                'image/png' => imagepng($image, $targetPath, 6),
                'image/webp' => imagewebp($image, $targetPath, 85),
                default => false,
            };
        } finally {
            unset($image);
        }

        if (!$saved) {
            @unlink($targetPath);
            throw new \RuntimeException('Could not store image.');
        }
    }

    private function validateDimensions(array|false $dimensions): void
    {
        $width = (int) ($dimensions[0] ?? 0);
        $height = (int) ($dimensions[1] ?? 0);
        if ($width < 1 || $height < 1 || $width > intdiv($this->uploadMaxPixels, $height)) {
            throw new \RuntimeException('Image dimensions are too large.');
        }
    }
}
