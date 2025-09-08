<?php
header('Content-Type: text/plain');

echo "=== VERIFICACIÓN ZIP VÍA WEB ===\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "SAPI: " . php_sapi_name() . "\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

echo "=== EXTENSIÓN ZIP ===\n";
if (class_exists('ZipArchive')) {
    echo "✅ ZipArchive está disponible\n";
    
    try {
        $zip = new ZipArchive();
        echo "✅ ZipArchive se puede instanciar\n";
        
        // Prueba de creación
        $testPath = sys_get_temp_dir() . '/test_web_' . time() . '.zip';
        if ($zip->open($testPath, ZipArchive::CREATE) === TRUE) {
            $zip->addFromString('test.txt', 'Test desde web');
            $zip->close();
            
            if (file_exists($testPath)) {
                echo "✅ Creación de ZIP funcional\n";
                echo "Tamaño: " . filesize($testPath) . " bytes\n";
                unlink($testPath);
            } else {
                echo "❌ Error al crear archivo ZIP\n";
            }
        } else {
            echo "❌ Error al abrir ZIP para escritura\n";
        }
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ ZipArchive NO está disponible\n";
    echo "ACCIÓN REQUERIDA: Reiniciar Apache después de habilitar extension=zip\n";
}

echo "\n=== EXTENSIONES CARGADAS ===\n";
$extensions = get_loaded_extensions();
$zipFound = false;
foreach ($extensions as $ext) {
    if (strtolower($ext) === 'zip') {
        echo "✅ zip: CARGADA\n";
        $zipFound = true;
        break;
    }
}

if (!$zipFound) {
    echo "❌ zip: NO ENCONTRADA\n";
}

echo "\n=== INFORMACIÓN PHP.INI ===\n";
echo "Archivo cargado: " . php_ini_loaded_file() . "\n";

echo "\nVerificación completada.\n";
?>