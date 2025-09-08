<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CleanJsonResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Solo aplicar a rutas API que esperan JSON
        if (!$request->is('api/*')) {
            return $next($request);
        }
        
        // Limpiar buffer de salida antes de procesar
        if (ob_get_level()) {
            ob_clean();
        }
        
        $response = $next($request);
        
        // Verificar si la respuesta debería ser JSON
        if ($request->expectsJson() || $request->is('api/*')) {
            $content = $response->getContent();
            
            // Si el contenido no es JSON válido, crear respuesta de error limpia
            if (!empty($content)) {
                json_decode($content);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    // Detectar si hay HTML en la respuesta
                    if (strpos($content, '<') !== false || strpos($content, 'Fatal error') !== false) {
                        $errorResponse = [
                            'success' => false,
                            'error' => 'Error interno del servidor - posible problema con extensión ZIP de PHP',
                            'debug' => 'HTML content detected in JSON response',
                            'suggestion' => 'Verificar que extension=zip esté habilitada en php.ini'
                        ];
                        
                        $response->setContent(json_encode($errorResponse));
                        $response->headers->set('Content-Type', 'application/json');
                    }
                }
            }
        }
        
        return $response;
    }
}