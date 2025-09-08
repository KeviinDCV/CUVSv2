<?php
/**
 * Servidor HTTPS simple para desarrollo Laravel
 * Maneja tanto HTTP como HTTPS usando certificados SSL locales
 */

// Configuración SSL
$sslContext = stream_context_create([
    'ssl' => [
        'local_cert' => __DIR__ . '/certificates/192.168.2.202+3.pem',
        'local_pk' => __DIR__ . '/certificates/192.168.2.202+3-key.pem',
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ]
]);

// Headers de seguridad para HTTPS
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Redirigir a Laravel
require_once __DIR__ . '/public/index.php';