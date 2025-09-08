<?php
// Archivo de descarga directo
error_reporting(0);
ini_set('display_errors', 0);

$file = $_GET['file'] ?? '';
if (empty($file)) {
    http_response_code(400);
    die('Archivo requerido');
}

$filename = basename($file);
$filePath = __DIR__ . '/../storage/app/downloads/' . $filename;

if (!file_exists($filePath)) {
    http_response_code(404);
    die('Archivo no encontrado');
}

// Si es directorio, crear ZIP
if (is_dir($filePath)) {
    $zipPath = sys_get_temp_dir() . '/' . $filename . '.zip';
    
    if (class_exists('ZipArchive')) {
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($filePath),
                RecursiveIteratorIterator::LEAVES_ONLY
            );
            
            foreach ($iterator as $file) {
                if (!$file->isDir()) {
                    $filePath_real = $file->getRealPath();
                    $relativePath = substr($filePath_real, strlen($filePath) + 1);
                    $zip->addFile($filePath_real, $relativePath);
                }
            }
            $zip->close();
            
            $filePath = $zipPath;
            $filename = $filename . '.zip';
        }
    }
}

$fileSize = filesize($filePath);
if ($fileSize === 0) {
    http_response_code(404);
    die('Archivo vacío');
}

// Headers para descarga
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . $fileSize);
header('Cache-Control: no-cache');

// Enviar archivo
readfile($filePath);

// Limpiar ZIP temporal
if (isset($zipPath) && file_exists($zipPath)) {
    unlink($zipPath);
}
exit;
?>
