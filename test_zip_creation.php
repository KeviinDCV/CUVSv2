<?php
require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\File;

// Simular el método createZipPackage
function testCreateZipPackage($sourcePath) {
    $downloadsPath = __DIR__ . '/storage/app/downloads';
    if (!is_dir($downloadsPath)) {
        mkdir($downloadsPath, 0755, true);
    }
    
    $packageName = 'json_procesados_sos_' . date('Y-m-d_H-i-s');
    
    echo "=== TEST CREACIÓN ZIP ===\n";
    echo "Source path: {$sourcePath}\n";
    echo "Downloads path: {$downloadsPath}\n";
    echo "Package name: {$packageName}\n";
    
    if (class_exists('ZipArchive')) {
        echo "✅ ZipArchive disponible\n";
        
        $zipPath = $downloadsPath . '/' . $packageName . '.zip';
        echo "ZIP path: {$zipPath}\n";
        
        $zip = new ZipArchive();
        
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            echo "✅ ZIP abierto para escritura\n";
            
            // Crear algunos archivos de prueba
            $testDir = __DIR__ . '/test_files';
            if (!is_dir($testDir)) {
                mkdir($testDir, 0755, true);
            }
            
            file_put_contents($testDir . '/test1.json', '{"test": "data1"}');
            file_put_contents($testDir . '/test2.json', '{"test": "data2"}');
            
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($testDir, RecursiveDirectoryIterator::SKIP_DOTS)
            );
            
            foreach ($iterator as $file) {
                if ($file->isFile()) {
                    $relativePath = substr($file->getPathname(), strlen($testDir) + 1);
                    $zip->addFile($file->getPathname(), $relativePath);
                    echo "Agregado: {$relativePath}\n";
                }
            }
            
            $zip->close();
            
            if (file_exists($zipPath)) {
                echo "✅ ZIP creado exitosamente\n";
                echo "Tamaño: " . filesize($zipPath) . " bytes\n";
                echo "Es archivo: " . (is_file($zipPath) ? 'SÍ' : 'NO') . "\n";
                echo "Es directorio: " . (is_dir($zipPath) ? 'SÍ' : 'NO') . "\n";
                echo "Basename: " . basename($zipPath) . "\n";
                echo "Termina en .zip: " . (str_ends_with(basename($zipPath), '.zip') ? 'SÍ' : 'NO') . "\n";
                
                return $zipPath;
            } else {
                echo "❌ ZIP no se creó\n";
            }
        } else {
            echo "❌ No se pudo abrir ZIP para escritura\n";
        }
    } else {
        echo "❌ ZipArchive no disponible\n";
    }
    
    return null;
}

// Ejecutar test
$result = testCreateZipPackage(__DIR__ . '/test_files');
echo "\nResultado: " . ($result ?: 'NULL') . "\n";
?>