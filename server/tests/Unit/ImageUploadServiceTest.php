<?php

namespace App\Tests\Unit;

use App\Service\ImageUploadService;
use PHPUnit\Framework\TestCase;

class ImageUploadServiceTest extends TestCase
{
    private string $targetDir;

    protected function setUp(): void
    {
        $this->targetDir = sys_get_temp_dir() . '/woofie_image_test_' . bin2hex(random_bytes(8));
    }

    protected function tearDown(): void
    {
        if (!is_dir($this->targetDir)) {
            return;
        }

        foreach (glob($this->targetDir . '/*') ?: [] as $file) {
            @unlink($file);
        }
        @rmdir($this->targetDir);
    }

    public function testStoresAReencodedImageWithARandomName(): void
    {
        $service = new ImageUploadService(1024 * 1024, 100);
        $path = $service->storeBase64Image($this->pngDataUrl(1, 1), $this->targetDir, '/uploads/test');

        self::assertMatchesRegularExpression('#^/uploads/test/[a-f0-9]{32}\.png$#', $path);
        self::assertFileExists($this->targetDir . '/' . basename($path));
        self::assertSame('image/png', (new \finfo(FILEINFO_MIME_TYPE))->file($this->targetDir . '/' . basename($path)));
    }

    public function testRejectsADeclaredMimeTypeThatDoesNotMatchTheFile(): void
    {
        $service = new ImageUploadService(1024 * 1024, 100);
        $payload = preg_replace('#^data:image/png#', 'data:image/jpeg', $this->pngDataUrl(1, 1));

        $this->expectException(\RuntimeException::class);
        $service->storeBase64Image((string) $payload, $this->targetDir, '/uploads/test');
    }

    public function testRejectsAnImageAboveThePixelLimit(): void
    {
        $service = new ImageUploadService(1024 * 1024, 1);

        $this->expectException(\RuntimeException::class);
        $service->storeBase64Image($this->pngDataUrl(2, 1), $this->targetDir, '/uploads/test');
    }

    private function pngDataUrl(int $width, int $height): string
    {
        $image = imagecreatetruecolor($width, $height);
        self::assertNotFalse($image);

        ob_start();
        imagepng($image);
        $binary = ob_get_clean();
        unset($image);

        self::assertIsString($binary);
        return 'data:image/png;base64,' . base64_encode($binary);
    }
}
