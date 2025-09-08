<?php
// Test directo para verificar el problema
$filename = 'json_procesados_2025-08-29_15-49-31';
$filePath = __DIR__ . '/../storage/app/downloads/' . $filename;

echo "Testing download path:\n";
echo "Filename: $filename\n";
echo "Full path: $filePath\n";
echo "File exists: " . (file_exists($filePath) ? 'YES' : 'NO') . "\n";
echo "Is directory: " . (is_dir($filePath) ? 'YES' : 'NO') . "\n";

if (file_exists($filePath)) {
    echo "Directory contents:\n";
    $files = scandir($filePath);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "  - $file\n";
        }
    }
}

// Test ZIP creation
if (is_dir($filePath)) {
    echo "\nTesting ZIP creation...\n";
    if (class_exists('ZipArchive')) {
        echo "ZipArchive is available\n";
        $zip = new ZipArchive();
        $zipPath = $filePath . '.zip';
        
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            echo "ZIP file created successfully\n";
            
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($filePath),
                RecursiveIteratorIterator::LEAVES_ONLY
            );
            
            foreach ($iterator as $file) {
                if (!$file->isDir()) {
                    $filePath_real = $file->getRealPath();
                    $relativePath = substr($filePath_real, strlen($filePath) + 1);
                    $zip->addFile($filePath_real, $relativePath);
                    echo "Added: $relativePath\n";
                }
            }
            
            $zip->close();
            echo "ZIP file size: " . filesize($zipPath) . " bytes\n";
        } else {
            echo "Failed to create ZIP file\n";
        }
    } else {
        echo "ZipArchive is NOT available\n";
    }
}
?>
