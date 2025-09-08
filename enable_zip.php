<?php
echo "=== HABILITADOR AUTOMÁTICO DE EXTENSIÓN ZIP ===\n";

// Obtener la ruta del php.ini
$phpIniPath = php_ini_loaded_file();
echo "Archivo php.ini: {$phpIniPath}\n";

if (!$phpIniPath || !file_exists($phpIniPath)) {
    echo "❌ ERROR: No se puede encontrar el archivo php.ini\n";
    exit(1);
}

// Leer el contenido actual
$content = file_get_contents($phpIniPath);
if ($content === false) {
    echo "❌ ERROR: No se puede leer el archivo php.ini\n";
    exit(1);
}

echo "\n=== ANALIZANDO CONFIGURACIÓN ACTUAL ===\n";

// Verificar si ya está habilitado
if (strpos($content, 'extension=zip') !== false && strpos($content, ';extension=zip') === false) {
    echo "✅ La extensión ZIP ya está habilitada en php.ini\n";
    
    // Verificar si PHP la reconoce
    if (extension_loaded('zip')) {
        echo "✅ PHP reconoce la extensión ZIP\n";
        echo "🔄 Puede que necesites reiniciar Apache/servidor web\n";
    } else {
        echo "❌ PHP no reconoce la extensión ZIP - revisar instalación\n";
    }
} else {
    echo "❌ La extensión ZIP no está habilitada\n";
    
    // Buscar si existe comentada
    if (strpos($content, ';extension=zip') !== false) {
        echo "📝 Encontrada extensión ZIP comentada - descomentando...\n";
        $newContent = str_replace(';extension=zip', 'extension=zip', $content);
    } else {
        echo "📝 Agregando extensión ZIP al archivo...\n";
        // Buscar la sección de extensiones
        if (strpos($content, '[PHP]') !== false) {
            $newContent = str_replace('[PHP]', "[PHP]\n; Extensión ZIP habilitada automáticamente\nextension=zip", $content);
        } else {
            // Agregar al final
            $newContent = $content . "\n; Extensión ZIP habilitada automáticamente\nextension=zip\n";
        }
    }
    
    // Crear backup
    $backupPath = $phpIniPath . '.backup.' . date('Y-m-d_H-i-s');
    if (copy($phpIniPath, $backupPath)) {
        echo "✅ Backup creado: {$backupPath}\n";
    } else {
        echo "⚠️ No se pudo crear backup\n";
    }
    
    // Escribir el nuevo contenido
    if (file_put_contents($phpIniPath, $newContent) !== false) {
        echo "✅ Archivo php.ini actualizado correctamente\n";
        echo "🔄 IMPORTANTE: Reinicia Apache para aplicar los cambios\n";
    } else {
        echo "❌ ERROR: No se pudo escribir el archivo php.ini\n";
        echo "💡 Ejecuta este script como administrador\n";
        exit(1);
    }
}

echo "\n=== VERIFICACIÓN POST-MODIFICACIÓN ===\n";

// Verificar que la línea esté presente
$updatedContent = file_get_contents($phpIniPath);
if (strpos($updatedContent, 'extension=zip') !== false && strpos($updatedContent, ';extension=zip') === false) {
    echo "✅ Configuración ZIP confirmada en php.ini\n";
} else {
    echo "❌ La configuración ZIP no se aplicó correctamente\n";
}

echo "\n=== INSTRUCCIONES FINALES ===\n";
echo "1. Reinicia Apache desde el Panel de Control de XAMPP\n";
echo "2. Ejecuta: php -m | findstr zip\n";
echo "3. Ejecuta: php check_system.php\n";
echo "4. Prueba la funcionalidad S.O.S\n";

echo "\n=== COMANDOS DE VERIFICACIÓN ===\n";
echo "php -m | findstr zip\n";
echo "php check_system.php\n";

echo "\nProceso completado.\n";
?>