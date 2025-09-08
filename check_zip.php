<?php
echo "=== VERIFICACIÓN DE ZIPARCHIVE ===\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "ZipArchive class exists: " . (class_exists('ZipArchive') ? 'SÍ' : 'NO') . "\n";

if (class_exists('ZipArchive')) {
    echo "ZipArchive está DISPONIBLE\n";
    $zip = new ZipArchive();
    echo "ZipArchive se puede instanciar: SÍ\n";
} else {
    echo "ZipArchive NO está disponible\n";
}

echo "Extensiones cargadas:\n";
$extensions = get_loaded_extensions();
foreach ($extensions as $ext) {
    if (stripos($ext, 'zip') !== false) {
        echo "- $ext\n";
    }
}
?>