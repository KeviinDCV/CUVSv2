<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Detectar entorno de desarrollo
        $isDevelopment = app()->environment('local', 'development');

        if ($isDevelopment) {
            $csp = $this->getDevelopmentCSP();
        } else {
            $csp = $this->getProductionCSP();
        }

        $response->headers->set('Content-Security-Policy', implode('; ', $csp));
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Download-Options', 'noopen');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');

        return $response;
    }

    private function getDevelopmentCSP(): array
    {
        $viteHost = env('VITE_DEV_HOST', '192.168.2.202');
        $vitePort = env('VITE_DEV_PORT', '5173');
        $viteServer = "http://{$viteHost}:{$vitePort}";
        $viteWsServer = "ws://{$viteHost}:{$vitePort}";

        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: {$viteServer}",
            "object-src 'none'",
            "base-uri 'self'",
            "connect-src 'self' blob: data: {$viteServer} {$viteWsServer}",
            "font-src 'self' https://fonts.bunny.net data:",
            "frame-src 'none'",
            "img-src 'self' data: blob:",
            "manifest-src 'self'",
            "media-src 'self' blob: data:",
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net {$viteServer}",
            "worker-src 'self' blob:",
            "child-src 'self' blob:",
            "form-action 'self'",
            "frame-ancestors 'none'",
            // NO incluir upgrade-insecure-requests en desarrollo para permitir HTTP
        ];
    }

    private function getProductionCSP(): array
    {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:",
            "object-src 'none'",
            "base-uri 'self'",
            "connect-src 'self' blob: data:",
            "font-src 'self' https://fonts.bunny.net data:",
            "frame-src 'none'",
            "img-src 'self' data: blob:",
            "manifest-src 'self'",
            "media-src 'self' blob: data:",
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",
            "worker-src 'self' blob:",
            "child-src 'self' blob:",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
        ];
    }
}