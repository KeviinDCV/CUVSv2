<?php
echo "=== DIAGNÓSTICO COMPLETO DEL SISTEMA ===\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Sistema Operativo: " . PHP_OS . "\n\n";

echo "=== EXTENSIONES CRÍTICAS ===\n";
$required_extensions = ['zip', 'json', 'fileinfo', 'mbstring'];
foreach ($required_extensions as $ext) {
    $status = extension_loaded($ext) ? '✅ DISPONIBLE' : '❌ FALTANTE';
    echo "- {$ext}: {$status}\n";
}

echo "\n=== VERIFICACIÓN ZIPARCHIVE ===\n";
if (class_exists('ZipArchive')) {
    echo "✅ ZipArchive está disponible\n";
    try {
        $zip = new ZipArchive();
        echo "✅ ZipArchive se puede instanciar\n";
        
        // Prueba de creación de ZIP
        $testPath = sys_get_temp_dir() . '/test_zip_' . time() . '.zip';
        if ($zip->open($testPath, ZipArchive::CREATE) === TRUE) {
            $zip->addFromString('test.txt', 'Contenido de prueba');
            $zip->close();
            
            if (file_exists($testPath)) {
                echo "✅ Creación de ZIP funcional\n";
                unlink($testPath);
            } else {
                echo "❌ Error al crear archivo ZIP\n";
            }
        } else {
            echo "❌ Error al abrir archivo ZIP para escritura\n";
        }
    } catch (Exception $e) {
        echo "❌ Error al usar ZipArchive: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ ZipArchive NO está disponible\n";
    echo "SOLUCIÓN: Habilitar extension=zip en php.ini\n";
}

echo "\n=== CONFIGURACIÓN PHP ===\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "\n";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "max_file_uploads: " . ini_get('max_file_uploads') . "\n";
echo "display_errors: " . ini_get('display_errors') . "\n";
echo "log_errors: " . ini_get('log_errors') . "\n";

echo "\n=== PERMISOS DE DIRECTORIO ===\n";
$directories = [
    __DIR__ . '/storage/app/temp_upload',
    __DIR__ . '/storage/app/json_organizados', 
    __DIR__ . '/storage/app/downloads',
    sys_get_temp_dir()
];

foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        @mkdir($dir, 0755, true);
    }
    
    $exists = file_exists($dir) ? '✅ EXISTE' : '❌ NO EXISTE';
    $writable = is_writable($dir) ? '✅ ESCRIBIBLE' : '❌ NO ESCRIBIBLE';
    echo "- {$dir}: {$exists}, {$writable}\n";
}

echo "\n=== INFORMACIÓN PHP.INI ===\n";
echo "Archivo php.ini cargado: " . php_ini_loaded_file() . "\n";
echo "Directorio de configuración: " . php_ini_scanned_files() . "\n";

echo "\n=== RECOMENDACIONES ===\n";
if (!class_exists('ZipArchive')) {
    echo "1. Habilitar extension=zip en php.ini\n";
    echo "2. Reiniciar Apache/servidor web\n";
    echo "3. Verificar con: php -m | findstr zip\n";
}

if (ini_get('display_errors') == '1') {
    echo "4. Considerar deshabilitar display_errors en producción\n";
}

echo "\nDiagnóstico completado.\n";
?>