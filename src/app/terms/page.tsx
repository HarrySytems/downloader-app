import React from 'react';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="flex-1 flex flex-col items-center bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
      <div className="w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4 px-6 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 w-fit">
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </Link>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">Términos de Servicio</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          <p className="mb-4">
            Bienvenido a ByteDownloader HD. Al utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguno de estos términos, te rogamos que no utilices nuestro servicio.
          </p>
          
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">1. Uso del Servicio</h2>
          <p className="mb-4">
            ByteDownloader HD es una herramienta gratuita que permite a los usuarios descargar videos e historias de plataformas públicas (TikTok y X/Twitter) estrictamente para fines personales, educativos o de archivo. 
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>No debes utilizar este servicio para descargar contenido protegido por derechos de autor sin el permiso explícito del creador.</li>
            <li>El uso de nuestra herramienta para fines comerciales o de re-distribución está estrictamente prohibido.</li>
            <li>No debes abusar del servicio mediante el envío de solicitudes automatizadas o intentar saturar nuestros servidores.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">2. Propiedad Intelectual</h2>
          <p className="mb-4">
            Todos los videos e imágenes descargados a través de nuestra herramienta pertenecen a sus respectivos dueños y creadores. ByteDownloader HD no aloja, guarda, ni posee ningún derecho sobre los videos procesados. Solo actuamos como un conducto técnico para facilitar el acceso a archivos públicos.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">3. Limitación de Responsabilidad</h2>
          <p className="mb-4">
            ByteDownloader HD se proporciona "tal cual". No garantizamos que el servicio esté siempre disponible, libre de errores, o que soporte todos los videos. No nos hacemos responsables por ningún daño directo o indirecto, pérdida de datos o problemas legales que puedan surgir del mal uso de nuestra herramienta por parte de los usuarios.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">4. Cambios en los Términos</h2>
          <p className="mb-4">
            Nos reservamos el derecho de modificar estos términos en cualquier momento sin previo aviso. Es responsabilidad del usuario revisar periódicamente esta página para estar al tanto de cualquier cambio.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
