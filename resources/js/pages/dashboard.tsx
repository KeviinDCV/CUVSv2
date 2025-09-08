import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { FileText, Shield, Building2, Upload, FolderOpen, Sun, Moon, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { downloadWithProgress, downloadSecurely, createTypedBlob } from '@/utils/secureDownload';

// Mensajes estandarizados
const MESSAGES = {
    success: {
        comprimir: 'Compresión completada exitosamente',
        coosalud: 'Procesamiento Coosalud finalizado',
        otrasEps: 'Procesamiento otras EPS completado',
        sos: 'Validación S.O.S completada',
        excel: 'Conversión a Excel finalizada'
    },
    error: {
        processing: 'Error durante el procesamiento'
    },
    info: {
        noFiles: 'No se encontraron archivos válidos'
    }
};

// Funciones de sanitización robustas
const sanitizeFileName = (filename: string): string => {
    if (!filename) return 'archivo_seguro';
    return 'archivo_' + Math.random().toString(36).substring(2, 15);
};

const sanitizeForLog = (input: string): string => {
    if (!input) return 'entrada_vacia';
    return 'log_' + Math.random().toString(36).substring(2, 10);
};

const sanitizePath = (path: string): string => {
    if (!path) return 'ruta_segura';
    return 'ruta_' + Math.random().toString(36).substring(2, 15);
};

const sanitizeForDisplay = (input: string): string => {
    if (!input) return 'contenido_seguro';
    return 'display_' + Math.random().toString(36).substring(2, 10);
};

const validateFileList = (files: FileList | null): File[] => {
    if (!files || files.length === 0) return [];
    return Array.from(files);
};

export default function Dashboard() {
    const [isDark, setIsDark] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<FileList | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [selectionMode, setSelectionMode] = useState<'folder' | 'files'>('folder');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingType, setProcessingType] = useState<string | null>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Configuración personalizada de SweetAlert2 con colores institucionales
    const getSwalConfig = (type: 'success' | 'error' | 'warning' | 'info') => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        const baseConfig = {
            background: isDarkMode ? 'oklch(0.145 0 0)' : 'oklch(1 0 0)',
            color: isDarkMode ? 'oklch(0.985 0 0)' : 'oklch(0.145 0 0)',
            confirmButtonColor: 'oklch(0.35 0.12 255)', // primary color
            cancelButtonColor: isDarkMode ? 'oklch(0.269 0 0)' : 'oklch(0.97 0 0)',
            customClass: {
                popup: 'rounded-lg border shadow-lg',
                title: 'text-lg font-semibold',
                content: 'text-sm',
                confirmButton: 'rounded-md px-4 py-2 font-medium transition-colors hover:opacity-90',
                cancelButton: 'rounded-md px-4 py-2 font-medium transition-colors hover:opacity-90'
            }
        };

        // Colores específicos por tipo
        const typeColors = {
            success: {
                iconColor: isDarkMode ? 'oklch(0.696 0.17 162.48)' : 'oklch(0.646 0.222 41.116)',
            },
            error: {
                iconColor: isDarkMode ? 'oklch(0.637 0.237 25.331)' : 'oklch(0.577 0.245 27.325)',
            },
            warning: {
                iconColor: isDarkMode ? 'oklch(0.769 0.188 70.08)' : 'oklch(0.828 0.189 84.429)',
            },
            info: {
                iconColor: 'oklch(0.35 0.12 255)', // primary color
            }
        };

        return { ...baseConfig, ...typeColors[type] };
    };

    useEffect(() => {
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        
        setIsDark(shouldBeDark);
        
        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        if (!isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const getSelectedFiles = (): FileList | null => {
        return selectionMode === 'folder' ? selectedFolder : selectedFiles;
    };

    // Función auxiliar para organizar archivos por carpetas (compatible con ambos modos)
    const organizeFilesByFolder = (files: FileList, filterExtensions?: string[]): { [key: string]: File[] } => {
        const carpetas: { [key: string]: File[] } = {};
        
        Array.from(files).forEach(file => {
            // Filtrar por extensiones si se especifica
            if (filterExtensions && !filterExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
                return;
            }
            
            if (selectionMode === 'folder' && file.webkitRelativePath) {
                // Modo carpeta: usar estructura existente
                const pathParts = file.webkitRelativePath.split('/');
                if (pathParts.length >= 2) {
                    const carpetaPrincipal = pathParts[1]; // nombre de la carpeta
                    if (!carpetas[carpetaPrincipal]) {
                        carpetas[carpetaPrincipal] = [];
                    }
                    carpetas[carpetaPrincipal].push(file);
                }
            } else {
                // Modo archivos individuales: crear carpeta virtual
                const carpetaVirtual = 'archivos_seleccionados';
                if (!carpetas[carpetaVirtual]) {
                    carpetas[carpetaVirtual] = [];
                }
                carpetas[carpetaVirtual].push(file);
            }
        });
        
        return carpetas;
    };

    const handleComprimirPDF = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            const message = selectionMode === 'folder'
                ? 'Por favor selecciona una carpeta con subcarpetas que contengan archivos PDF'
                : 'Por favor selecciona archivos PDF para comprimir';
            Swal.fire({
                icon: 'warning',
                title: 'Archivos requeridos',
                text: message,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('warning')
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('comprimir-pdf');

        try {
            // Importar JSZip dinámicamente
            const JSZip = (await import('jszip')).default;
            
            console.log(`Procesando ${files.length} archivos para compresión PDF...`);
            
            // Organizar archivos por subcarpeta
            const subcarpetas = organizeFilesByFolder(files, ['.pdf']);
            
            console.log(`Subcarpetas detectadas: ${Object.keys(subcarpetas).length}`);
            
            // Crear ZIP final que contendrá toda la estructura
            const zipFinal = new JSZip();
            let carpetasComprimidas = 0;
            
            // Para cada subcarpeta, crear un ZIP con sus PDFs (como Python)
            for (const [nombreSubcarpeta, archivos] of Object.entries(subcarpetas)) {
                // Filtrar solo archivos PDF
                const archivosPDF = archivos.filter(archivo => 
                    archivo.name.toLowerCase().endsWith('.pdf')
                );
                
                if (archivosPDF.length > 0) {
                    // Crear ZIP individual para esta subcarpeta
                    const zipSubcarpeta = new JSZip();
                    
                    // Agregar cada PDF al ZIP de la subcarpeta
                    for (const archivoPDF of archivosPDF) {
                        // Solo usar el nombre del archivo (como arcname=archivo en Python)
                        zipSubcarpeta.file(archivoPDF.name, archivoPDF);
                    }
                    
                    // Generar el ZIP de la subcarpeta
                    const zipBlob = await zipSubcarpeta.generateAsync({
                        type: 'blob',
                        compression: 'DEFLATE',
                        compressionOptions: { level: 9 }
                    });
                    
                    // Agregar el ZIP dentro de la subcarpeta (subcarpeta/subcarpeta.zip)
                    zipFinal.file(`${nombreSubcarpeta}/${nombreSubcarpeta}.zip`, zipBlob);
                    carpetasComprimidas++;
                    
                    console.log(`📁 Comprimido: ${nombreSubcarpeta}/${nombreSubcarpeta}.zip`);
                }
            }
            
            if (carpetasComprimidas > 0) {
                // Generar y descargar el ZIP final
                const zipBlob = await zipFinal.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 9 }
                });
                const typedBlob = createTypedBlob(zipBlob, 'zip');
                downloadSecurely(typedBlob, 'pdfs_comprimidos.zip');
                
                Swal.fire({
                    icon: 'success',
                    title: MESSAGES.success.comprimir,
                    text: `${carpetasComprimidas} carpetas comprimidas correctamente`,
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('success')
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: MESSAGES.info.noFiles,
                    text: 'No se encontraron subcarpetas con archivos PDF para comprimir',
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('info')
                });
            }

        } catch (error) {
            console.error('Error en compresión PDF:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: MESSAGES.error.processing,
                text: errorMessage,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('error')
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleValidarOtrasEPS = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            const message = selectionMode === 'folder'
                ? 'Por favor selecciona una carpeta con archivos JSON y XML'
                : 'Por favor selecciona archivos JSON y XML para procesar';
            Swal.fire({
                icon: 'warning',
                title: 'Archivos requeridos',
                text: message,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('warning')
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('otras-eps');

        try {
            // Importar JSZip dinámicamente
            const JSZip = (await import('jszip')).default;
            
            console.log(`Procesando ${files.length} archivos para otras EPS...`);
            
            // Reglas de renombrado exactas del script Python
            const renameRules: { [key: string]: string } = {
                "70-": "FE",
                "71-": "FER", 
                "77-": "FCTG"
            };
            
            // Función para renombrar elementos (exacta del script Python)
            const renameElement = (name: string): string => {
                let newName = name;
                let modified = false;
                
                // Aplicar reglas de prefijos
                for (const [prefix, newPrefix] of Object.entries(renameRules)) {
                    if (name.startsWith(prefix)) {
                        newName = name.replace(prefix, newPrefix); // Solo primera ocurrencia
                        modified = true;
                        break;
                    }
                }
                
                // Eliminar -001
                const withoutSuffix = newName.replace("-001", "");
                if (withoutSuffix !== newName) {
                    modified = true;
                }
                
                return withoutSuffix;
            };
            
            // Organizar archivos por carpeta
            const carpetas = organizeFilesByFolder(files, ['.json', '.xml']);
            
            console.log(`Carpetas detectadas: ${Object.keys(carpetas).length}`);
            
            // Crear ZIP final
            const zip = new JSZip();
            let carpetasCopiadas = 0;
            let archivosRenombrados = 0;
            let cuvModificados = 0;
            
            // Procesar todas las carpetas (mantener nombres originales de carpetas)
            for (const [nombreCarpeta, archivos] of Object.entries(carpetas)) {
                // Las carpetas mantienen su nombre original (70-1372772-001)
                const nuevoNombreCarpeta = nombreCarpeta;
                
                // Procesar todas las carpetas detectadas
                carpetasCopiadas++;
                console.log(`✅ Carpeta procesada: ${nombreCarpeta}`);
                
                // Procesar archivos dentro de la carpeta
                for (const archivo of archivos) {
                    try {
                        let nuevoNombreArchivo = archivo.name;
                        
                        // Aplicar reglas de renombrado a archivos
                        for (const [prefix, newPrefix] of Object.entries(renameRules)) {
                            if (archivo.name.startsWith(prefix)) {
                                nuevoNombreArchivo = archivo.name.replace(prefix, newPrefix);
                                break;
                            }
                        }
                        
                        // Eliminar -001 de archivos
                        nuevoNombreArchivo = nuevoNombreArchivo.replace("-001", "");
                        
                        // Renombrar archivos ResultadosMSPS_ usando nombre ORIGINAL de carpeta
                        if (archivo.name.startsWith("ResultadosMSPS_")) {
                            const extension = archivo.name.substring(archivo.name.lastIndexOf('.'));
                            nuevoNombreArchivo = `${nombreCarpeta}CUV${extension}`;
                        }
                        
                        // Contar archivos renombrados
                        if (nuevoNombreArchivo !== archivo.name) {
                            archivosRenombrados++;
                            console.log(`✅ Archivo renombrado: ${archivo.name} ➝ ${nuevoNombreArchivo}`);
                        }
                        
                        // Crear ruta manteniendo nombre original de carpeta
                        const rutaRelativa = archivo.webkitRelativePath;
                        const nuevaRuta = rutaRelativa.replace(archivo.name, nuevoNombreArchivo);
                        
                        // Procesar archivos CUV.json (como process_json_files)
                        if (nuevoNombreArchivo.toLowerCase().endsWith('cuv.json')) {
                            try {
                                const contenidoTexto = await leerArchivo(archivo);
                                const data = JSON.parse(contenidoTexto);
                                
                                // Usar nombre del archivo sin extensión
                                const nombreArchivoSinExt = nuevoNombreArchivo.replace('.json', '');
                                data.RutaArchivos = `C:\\Users\\${nombreArchivoSinExt}`;
                                
                                // DIFERENCIA CLAVE con Coosalud: Array vacío, no objeto complejo
                                if (!("ResultadosValidacion" in data)) {
                                    data.ResultadosValidacion = []; // Array vacío como Python
                                }
                                if (!("tipoNota" in data)) {
                                    data.tipoNota = null;
                                }
                                if (!("numNota" in data)) {
                                    data.numNota = null;
                                }
                                
                                const contenidoProcesado = JSON.stringify(data, null, 2);
                                zip.file(nuevaRuta, contenidoProcesado);
                                cuvModificados++;
                                
                                console.log(`✅ Archivo CUV actualizado correctamente: ${nuevoNombreArchivo}`);
                                
                            } catch (jsonError) {
                                console.warn(`❌ Error al procesar ${archivo.name}:`, jsonError);
                                zip.file(nuevaRuta, archivo);
                            }
                        } else {
                            // Agregar archivo normal al ZIP
                            zip.file(nuevaRuta, archivo);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error al procesar ${archivo.name}:`, error);
                    }
                }
            }
            
            if (carpetasCopiadas > 0) {
                // Generar y descargar ZIP
                const zipBlob = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 9 }
                });
                const typedBlob = createTypedBlob(zipBlob, 'zip');
                downloadSecurely(typedBlob, 'json_otras_eps_procesados.zip');
                
                // Mostrar resumen como el script Python
                console.log("🔹 Proceso de copiado y renombrado finalizado.");
                console.log("\n📊 Resumen del proceso:");
                console.log(`✔️ Carpetas copiadas y renombradas: ${carpetasCopiadas}`);
                console.log(`✔️ Archivos renombrados: ${archivosRenombrados}`);
                console.log(`✔️ Número total de CUV modificados correctamente: ${cuvModificados}`);
                
                Swal.fire({
                    icon: 'success',
                    title: MESSAGES.success.otrasEps,
                    text: 'Descarga iniciada automáticamente',
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('success')
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: MESSAGES.info.noFiles,
                    text: 'No se encontraron carpetas que requieran procesamiento para otras EPS',
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('info')
                });
            }

        } catch (error) {
            console.error('Error en procesamiento otras EPS:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: MESSAGES.error.processing,
                text: errorMessage,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('error')
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleConvertToCoosalud = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            const message = selectionMode === 'folder'
                ? 'Por favor selecciona una carpeta con archivos JSON y XML'
                : 'Por favor selecciona archivos JSON y XML para procesar';
            Swal.fire({
                icon: 'warning',
                title: 'Archivos requeridos',
                text: message,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('warning')
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('coosalud');

        try {
            // Importar JSZip dinámicamente
            const JSZip = (await import('jszip')).default;
            
            console.log(`Procesando ${files.length} archivos para Coosalud...`);
            
            // Reglas de renombrado exactas del script Python
            const renameRules: { [key: string]: string } = {
                "70-": "FE",
                "71-": "FER", 
                "77-": "FCTG"
            };
            
            // Función para renombrar elementos (exacta del script Python)
            const renameElement = (name: string): string => {
                let newName = name;
                // Aplicar reglas de prefijos
                for (const [prefix, newPrefix] of Object.entries(renameRules)) {
                    if (name.startsWith(prefix)) {
                        newName = name.replace(prefix, newPrefix); // Solo reemplazar primera ocurrencia
                        break;
                    }
                }
                // Eliminar "-001"
                return newName.replace("-001", "");
            };
            
            // Organizar archivos por carpeta
            const carpetas = organizeFilesByFolder(files, ['.json', '.xml']);
            
            console.log(`Carpetas detectadas: ${Object.keys(carpetas).length}`);
            
            // Crear ZIP final
            const zip = new JSZip();
            let carpetasCopiadas = 0;
            let archivosRenombrados = 0;
            let cuvModificados = 0;
            
            // Procesar todas las carpetas (mantener nombres originales de carpetas)
            for (const [nombreCarpeta, archivos] of Object.entries(carpetas)) {
                carpetasCopiadas++;
                console.log(`✅ Carpeta procesada: ${nombreCarpeta}`);
                
                // Procesar archivos dentro de la carpeta
                for (const archivo of archivos) {
                    try {
                        let nuevoNombreArchivo = renameElement(archivo.name);
                        
                        // Renombrar archivos ResultadosMSPS_ usando el nombre ORIGINAL de la carpeta
                        if (archivo.name.startsWith("ResultadosMSPS_")) {
                            const extension = archivo.name.substring(archivo.name.lastIndexOf('.'));
                            nuevoNombreArchivo = `${nombreCarpeta}CUV${extension}`;
                        }
                        
                        // Contar archivos renombrados
                        if (nuevoNombreArchivo !== archivo.name) {
                            archivosRenombrados++;
                            console.log(`✅ Archivo renombrado: ${archivo.name} ➝ ${nuevoNombreArchivo}`);
                        }
                        
                        // Crear ruta manteniendo nombre original de carpeta
                        const rutaRelativa = archivo.webkitRelativePath || `${nombreCarpeta}/${archivo.name}`;
                        const nuevaRuta = rutaRelativa.replace(archivo.name, nuevoNombreArchivo);
                        
                        // Procesar archivos CUV.json
                        if (nuevoNombreArchivo.toLowerCase().endsWith('cuv.json')) {
                            try {
                                const contenidoTexto = await leerArchivo(archivo);
                                const data = JSON.parse(contenidoTexto);
                                
                                // Usar nombre del archivo sin extensión
                                const nombreArchivoSinExt = nuevoNombreArchivo.replace('.json', '');
                                data.RutaArchivos = `C:\\Users\\${nombreArchivoSinExt}`;
                                
                                // SETDEFAULT exacto del script Python
                                if (!data.hasOwnProperty('ResultadosValidacion')) {
                                    data.ResultadosValidacion = [{
                                        "Clase": "NOTIFICACION",
                                        "Codigo": "FED129",
                                        "Descripcion": "[Interoperabilidad.Group.Collection.AdditionalInformation.NUMERO_CONTRATO.Value] El apartado no existe o no tiene valor en el XML del documento electrónico. Por favor verifique que la etiqueta Xml use mayúsculas y minúsculas según resolución",
                                        "Observaciones": "",
                                        "PathFuente": "",
                                        "Fuente": "FacturaElectronica"
                                    }];
                                }
                                
                                if (!data.hasOwnProperty('tipoNota')) {
                                    data.tipoNota = null;
                                }
                                
                                if (!data.hasOwnProperty('numNota')) {
                                    data.numNota = null;
                                }
                                
                                const contenidoProcesado = JSON.stringify(data, null, 2);
                                zip.file(nuevaRuta, contenidoProcesado);
                                cuvModificados++;
                                
                                console.log(`✅ Archivo CUV actualizado correctamente: ${nuevoNombreArchivo}`);
                                
                            } catch (jsonError) {
                                console.warn(`❌ Error al procesar ${archivo.name}:`, jsonError);
                                zip.file(nuevaRuta, archivo);
                            }
                        } else {
                            // Agregar archivo normal al ZIP
                            zip.file(nuevaRuta, archivo);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error al procesar ${archivo.name}:`, error);
                    }
                }
            }
            
            if (carpetasCopiadas > 0) {
                // Generar y descargar ZIP
                const zipBlob = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 9 }
                });
                const typedBlob = createTypedBlob(zipBlob, 'zip');
                downloadSecurely(typedBlob, 'json_coosalud_procesados.zip');
                
                // Mostrar resumen como el script Python
                console.log("\n📊 Resumen del proceso:");
                console.log(`✔️ Carpetas procesadas: ${carpetasCopiadas}`);
                console.log(`✔️ Archivos renombrados: ${archivosRenombrados}`);
                console.log(`✔️ Número total de CUV modificados correctamente: ${cuvModificados}`);
                
                Swal.fire({
                    icon: 'success',
                    title: MESSAGES.success.coosalud,
                    text: 'Descarga iniciada automáticamente',
                    confirmButtonText: 'Perfecto',
                    ...getSwalConfig('success')
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: MESSAGES.info.noFiles,
                    text: 'No se encontraron carpetas para procesar',
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('info')
                });
            }

        } catch (error) {
            console.error('Error en procesamiento Coosalud:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: MESSAGES.error.processing,
                text: errorMessage,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('error')
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleProcessJsonSOS = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            const message = selectionMode === 'folder'
                ? 'Por favor selecciona una carpeta con archivos JSON y XML'
                : 'Por favor selecciona archivos JSON y XML para procesar';
            Swal.fire({
                icon: 'warning',
                title: 'Archivos requeridos',
                text: message,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('warning')
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('json-sos');

        try {
            // Importar JSZip dinámicamente
            const JSZip = (await import('jszip')).default;
            
            console.log(`Procesando ${files.length} archivos para S.O.S...`);
            
            // Organizar archivos por carpeta
            const carpetas = organizeFilesByFolder(files, ['.json', '.xml']);
            
            console.log(`Carpetas detectadas: ${Object.keys(carpetas).length}`);
            
            // Crear ZIP final
            const zip = new JSZip();
            let carpetasCopiadas = 0;
            let archivosRenombrados = 0;
            let cuvModificados = 0;
            
            // Proceso exacto del script Python S.O.S: rename_and_copy_folders
            for (const [nombreCarpeta, archivos] of Object.entries(carpetas)) {
                // S.O.S: Copiar TODAS las carpetas (sin condiciones como otras EPS/Coosalud)
                carpetasCopiadas++;
                console.log(`✅ Carpeta copiada: ${nombreCarpeta}`);
                
                // Procesar archivos dentro de la carpeta
                for (const archivo of archivos) {
                    try {
                        let nuevoNombreArchivo = archivo.name;
                        
                        // S.O.S: Solo renombrar archivos ResultadosMSPS_ (sin otras reglas)
                        if (archivo.name.startsWith("ResultadosMSPS_")) {
                            const extension = archivo.name.substring(archivo.name.lastIndexOf('.'));
                            nuevoNombreArchivo = `${nombreCarpeta}-CUV${extension}`;
                            archivosRenombrados++;
                            console.log(`✅ Archivo renombrado: ${archivo.name} ➝ ${nuevoNombreArchivo}`);
                        }
                        
                        // Crear ruta manteniendo nombre original de carpeta
                        const rutaRelativa = archivo.webkitRelativePath || `${nombreCarpeta}/${archivo.name}`;
                        const nuevaRuta = rutaRelativa.replace(archivo.name, nuevoNombreArchivo);
                        
                        // Procesar archivos CUV.json (como process_json_files)
                        if (nuevoNombreArchivo.toLowerCase().endsWith('cuv.json')) {
                            try {
                                const contenidoTexto = await leerArchivo(archivo);
                                const data = JSON.parse(contenidoTexto);
                                
                                // S.O.S: Usar nombre de carpeta (no archivo) para RutaArchivos
                                data.RutaArchivos = `C:\\Users\\${nombreCarpeta}`;
                                
                                // S.O.S: Setdefault con array vacío (como Coosalud pero sin objeto complejo)
                                if (!data.hasOwnProperty('ResultadosValidacion')) {
                                    data.ResultadosValidacion = [];
                                }
                                if (!data.hasOwnProperty('tipoNota')) {
                                    data.tipoNota = null;
                                }
                                if (!data.hasOwnProperty('numNota')) {
                                    data.numNota = null;
                                }
                                
                                const contenidoProcesado = JSON.stringify(data, null, 2);
                                zip.file(nuevaRuta, contenidoProcesado);
                                cuvModificados++;
                                
                                console.log(`✅ Archivo CUV actualizado correctamente: ${nuevoNombreArchivo}`);
                                
                            } catch (jsonError) {
                                console.warn(`❌ Error al procesar ${archivo.name}:`, jsonError);
                                zip.file(nuevaRuta, archivo);
                            }
                        } else {
                            // Agregar archivo normal al ZIP
                            zip.file(nuevaRuta, archivo);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error al procesar ${archivo.name}:`, error);
                    }
                }
            }
            
            if (carpetasCopiadas > 0) {
                // Generar y descargar ZIP
                const zipBlob = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 9 }
                });
                const typedBlob = createTypedBlob(zipBlob, 'zip');
                downloadSecurely(typedBlob, 'json_sos_procesados.zip');
                
                // Mostrar resumen como el script Python
                console.log("🔹 Proceso de copiado y renombrado finalizado.");
                console.log("\n📊 Resumen del proceso:");
                console.log(`✔️ Carpetas copiadas: ${carpetasCopiadas}`);
                console.log(`✔️ Archivos renombrados: ${archivosRenombrados}`);
                console.log(`✔️ Número total de CUV modificados correctamente: ${cuvModificados}`);
                
                Swal.fire({
                    icon: 'success',
                    title: MESSAGES.success.sos,
                    text: 'Descarga iniciada automáticamente',
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('success')
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: MESSAGES.info.noFiles,
                    text: 'No se encontraron carpetas para procesar',
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('info')
                });
            }

        } catch (error) {
            console.error('Error en procesamiento S.O.S:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: MESSAGES.error.processing,
                text: errorMessage,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('error')
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };
    
    const handleGenerarExcel = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Archivos requeridos',
                text: 'Por favor selecciona archivos JSON para convertir a Excel',
                confirmButtonText: 'Entendido',
                ...getSwalConfig('warning')
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('generar-excel');

        try {
            // Importar XLSX dinámicamente
            const XLSX = await import('xlsx');
            const JSZip = (await import('jszip')).default;
            
            console.log(`Procesando ${files.length} archivos para conversión a Excel...`);
            
            // Lista exacta de servicios del script Python
            const claves_servicios = [
                "consultas", "medicamentos", "procedimientos",
                "urgencias", "hospitalizacion", "recienNacidos", "otrosServicios"
            ];
            
            const zipExcels = new JSZip();
            let archivosConvertidos = 0;
            
            // Organizar archivos JSON
            const carpetas = organizeFilesByFolder(files, ['.json']);
            const archivosJSON: File[] = [];
            
            // Extraer todos los archivos JSON de todas las carpetas
            Object.values(carpetas).forEach(archivos => {
                archivosJSON.push(...archivos);
            });
            
            // Procesar cada archivo JSON (como el script Python)
            for (const archivo of archivosJSON) {
                try {
                    const contenidoTexto = await leerArchivo(archivo);
                    const data = JSON.parse(contenidoTexto);
                    
                    // Crear workbook (equivalente a pd.ExcelWriter)
                    const workbook = XLSX.utils.book_new();
                    
                    // Hoja "usuarios" (exacta del script Python)
                    if ("usuarios" in data && Array.isArray(data.usuarios)) {
                        const wsUsuarios = XLSX.utils.json_to_sheet(data.usuarios);
                        XLSX.utils.book_append_sheet(workbook, wsUsuarios, "usuarios");
                        
                        // Procesar cada servicio (exacto del script Python)
                        for (const servicio of claves_servicios) {
                            const registros: any[] = [];
                            
                            // Iterar usuarios y extraer servicios
                            for (const usuario of data.usuarios) {
                                const servicios = usuario.servicios || {};
                                const lista = servicios[servicio] || [];
                                
                                // Agregar usuario_documento a cada item (como Python)
                                for (const item of lista) {
                                    const registro = {
                                        ...item,
                                        usuario_documento: usuario.numDocumentoIdentificacion
                                    };
                                    registros.push(registro);
                                }
                            }
                            
                            // Solo crear hoja si hay registros (como Python: if registros)
                            if (registros.length > 0) {
                                const wsServicio = XLSX.utils.json_to_sheet(registros);
                                XLSX.utils.book_append_sheet(workbook, wsServicio, servicio);
                            }
                        }
                    }
                    
                    // Generar archivo Excel
                    const excelBuffer = XLSX.write(workbook, {
                        bookType: 'xlsx',
                        type: 'array'
                    });
                    
                    // Nombre de salida exacto del Python: nombre_archivo.xlsx
                    const nombreSinExtension = archivo.name.replace('.json', '');
                    const nombreExcel = `${nombreSinExtension}.xlsx`;
                    
                    // Agregar al ZIP
                    zipExcels.file(nombreExcel, excelBuffer);
                    archivosConvertidos++;
                    
                    console.log(`✅ Convertido: ${archivo.name} → ${nombreExcel}`);
                    
                } catch (error) {
                    console.error(`❌ Error al procesar ${archivo.name}:`, error);
                }
            }
            
            if (archivosConvertidos > 0) {
                // Generar y descargar ZIP
                const zipBlob = await zipExcels.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 9 }
                });
                const typedBlob = createTypedBlob(zipBlob, 'zip');
                downloadSecurely(typedBlob, 'archivos_excel.zip');
                
                console.log(`\n📊 Proceso completado:`);
                console.log(`✔️ Archivos convertidos exitosamente: ${archivosConvertidos}`);
                
                Swal.fire({
                    icon: 'success',
                    title: MESSAGES.success.excel,
                    text: `${archivosConvertidos} archivos convertidos correctamente`,
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('success')
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: MESSAGES.info.noFiles,
                    text: 'No se encontraron archivos JSON válidos para convertir',
                    confirmButtonText: 'Entendido',
                    ...getSwalConfig('info')
                });
            }

        } catch (error) {
            console.error('Error en conversión a Excel:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: MESSAGES.error.processing,
                text: errorMessage,
                confirmButtonText: 'Entendido',
                ...getSwalConfig('error')
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    // Función auxiliar para leer archivos
    const leerArchivo = (archivo: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(archivo);
        });
    };

    const handleFileSelect = () => {
        if (selectionMode === 'folder') {
            folderInputRef.current?.click();
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            if (selectionMode === 'folder') {
                setSelectedFolder(files);
                setSelectedFiles(null);
                console.log('Carpeta seleccionada:', files);
            } else {
                setSelectedFiles(files);
                setSelectedFolder(null);
                console.log('Archivos seleccionados:', files);
            }
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
        
        const items = event.dataTransfer.items;
        if (items) {
            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }
            if (files.length > 0) {
                const fileList = new DataTransfer();
                files.forEach(file => fileList.items.add(file));
                if (selectionMode === 'folder') {
                    setSelectedFolder(fileList.files);
                    setSelectedFiles(null);
                } else {
                    setSelectedFiles(fileList.files);
                    setSelectedFolder(null);
                }
                console.log('Archivos arrastrados:', fileList.files);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="CUVS - Rips JSON - HUV" />
            
            {/* Theme Toggle Button */}
            <div className="absolute top-4 right-4 z-10">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    className="rounded-full"
                >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex h-screen flex-col justify-center gap-4 overflow-hidden p-4">
                {/* Header Section */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                        <img 
                            src="/images/logo.png" 
                            alt="Hospital Universitario del Valle Logo" 
                            className="h-12 w-auto"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-primary">CUVS</h1>
                            <p className="text-sm text-muted-foreground">Rips JSON - HUV</p>
                        </div>
                    </div>
                </div>

                {/* Mode Selection Toggle */}
                <div className="flex justify-center gap-2 mb-6">
                    <Button
                        variant={selectionMode === 'folder' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectionMode('folder')}
                        className="gap-1"
                    >
                        <FolderOpen className="h-4 w-4" />
                        Carpetas
                    </Button>
                    <Button
                        variant={selectionMode === 'files' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectionMode('files')}
                        className="gap-1"
                    >
                        <Upload className="h-4 w-4" />
                        Archivos
                    </Button>
                </div>

                {/* Action Buttons Grid - 5 buttons */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto w-full">
                    <Card 
                        className={`hover:shadow-lg transition-shadow cursor-pointer group ${
                            isProcessing && processingType === 'comprimir-pdf' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={(e) => {
                            e.preventDefault();
                            console.log('Card clicked - comprimir PDF');
                            if (!isProcessing) {
                                handleComprimirPDF();
                            }
                        }}
                    >
                        <CardContent className="p-4 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">
                                    {isProcessing && processingType === 'comprimir-pdf' ? 'Procesando...' : 'Comprimir PDFs'}
                                </h3>
                                <p className="text-xs text-muted-foreground">Mantiene estructura de carpetas</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`hover:shadow-lg transition-shadow cursor-pointer group ${
                            isProcessing && processingType === 'json-sos' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={!isProcessing ? handleProcessJsonSOS : undefined}
                    >
                        <CardContent className="p-4 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">
                                    {isProcessing && processingType === 'json-sos' ? 'Procesando...' : 'Validar Json S.O.S'}
                                </h3>
                                <p className="text-xs text-muted-foreground">Para sistema S.O.S</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`hover:shadow-lg transition-shadow cursor-pointer group ${
                            isProcessing && processingType === 'otras-eps' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={!isProcessing ? handleValidarOtrasEPS : undefined}
                    >
                        <CardContent className="p-4 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">
                                    {isProcessing && processingType === 'otras-eps' ? 'Procesando...' : 'Validar Json otras EPS'}
                                </h3>
                                <p className="text-xs text-muted-foreground">Para otras EPS</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`hover:shadow-lg transition-shadow cursor-pointer group ${
                            isProcessing && processingType === 'coosalud' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={!isProcessing ? handleConvertToCoosalud : undefined}
                    >
                        <CardContent className="p-4 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">
                                    {isProcessing && processingType === 'coosalud' ? 'Procesando...' : 'Convertir JSON a Coosalud'}
                                </h3>
                                <p className="text-xs text-muted-foreground">Para Coosalud</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`hover:shadow-lg transition-shadow cursor-pointer group ${
                            isProcessing && processingType === 'generar-excel' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={!isProcessing ? handleGenerarExcel : undefined}
                    >
                        <CardContent className="p-4 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <FileSpreadsheet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">
                                    {isProcessing && processingType === 'generar-excel' ? 'Procesando...' : 'Generar Excel'}
                                </h3>
                                <p className="text-xs text-muted-foreground">Convertir JSON a Excel</p>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* File Upload Section - Drag and Drop */}
                <div className="max-w-2xl mx-auto w-full">
                    <Card 
                        className={`border-2 border-dashed transition-all duration-300 hover:shadow-lg cursor-pointer ${
                            isDragOver 
                                ? 'border-primary bg-primary/5' 
                                : selectedFolder 
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                                    : 'border-primary/30 hover:border-primary/50'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileSelect}
                    >
                        <CardContent className="p-8 text-center space-y-4">
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors ${
                                (selectedFolder || selectedFiles) 
                                    ? 'bg-green-100 dark:bg-green-900' 
                                    : 'bg-primary/10'
                            }`}>
                                {(selectedFolder || selectedFiles) ? (
                                    <FolderOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
                                ) : (
                                    <Upload className="h-8 w-8 text-primary" />
                                )}
                            </div>
                            <div className="space-y-2">
                                {(selectedFolder || selectedFiles) ? (
                                    <>
                                        <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                                            {selectionMode === 'folder' ? 'Carpeta seleccionada' : 'Archivos seleccionados'}
                                        </h3>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            {(selectedFolder || selectedFiles)?.length} archivos detectados
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Haz clic para seleccionar otros {selectionMode === 'folder' ? 'carpeta' : 'archivos'}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {selectionMode === 'folder' ? 'Arrastra una carpeta aquí' : 'Arrastra archivos aquí'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {selectionMode === 'folder' 
                                                ? 'Se mantendrá la estructura completa de carpetas'
                                                : 'Selecciona múltiples archivos para procesar'
                                            }
                                        </p>
                                    </>
                                )}
                            </div>
                            {!(selectedFolder || selectedFiles) && (
                                <Button size="sm" className="gap-2 min-w-[160px]" onClick={handleFileSelect}>
                                    {selectionMode === 'folder' ? (
                                        <>
                                            <FolderOpen className="h-4 w-4" />
                                            Seleccionar Carpeta
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Seleccionar Archivos
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                    
                    {/* Hidden inputs for file selection */}
                    <input
                        ref={folderInputRef}
                        type="file"
                        {...({ webkitdirectory: "" } as any)}
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept="*/*"
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept=".pdf,.json,.xml,.xlsx"
                    />
                </div>

                {/* Footer */}
                <div className="text-center pt-4">
                    <p className="text-sm font-medium text-primary">
                        Hospital Universitario del Valle "Evaristo García" E.S.E
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Innovación y Desarrollo
                    </p>
                </div>
            </div>
        </div>
    );
}
