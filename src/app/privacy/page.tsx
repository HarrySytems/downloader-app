import React from 'react';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          <p className="mb-4">
            En ByteDownloader HD, tu privacidad es nuestra máxima prioridad. Esta Política de Privacidad describe cómo manejamos la información cuando utilizas nuestro servicio.
          </p>
          
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">1. No Almacenamos Tus Descargas</h2>
          <p className="mb-4">
            Nuestra política principal es de <strong>cero retención</strong>. No descargamos, copiamos ni almacenamos permanentemente en nuestros servidores los videos, fotos o historias que procesas. Todo el contenido viaja directamente desde los servidores de la red social original (TikTok, X) hasta tu dispositivo. 
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">2. Recopilación de Datos Personales</h2>
          <p className="mb-4">
            ByteDownloader HD no requiere que te registres ni que preociones información personal. No recopilamos tu nombre, correo electrónico, número de teléfono ni ninguna otra información que te identifique directamente.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">3. Logs y Análisis Anónimo</h2>
          <p className="mb-4">
            Como la mayoría de los sitios web estándar, podemos registrar de forma anónima información técnica básica (como tu dirección IP ofuscada, tipo de navegador y errores de sistema) exclusivamente con el propósito de mantener la seguridad del servidor y solucionar errores técnicos. Esta información técnica se borra periódicamente y jamás se comparte con terceros.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">4. Uso de Cookies</h2>
          <p className="mb-4">
            No utilizamos cookies de seguimiento publicitario ni vendemos perfiles de navegación. Podríamos utilizar cookies técnicas esenciales estrictamente necesarias para el funcionamiento del servicio y prevenir ataques o abuso de la red.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">5. Seguridad</h2>
          <p className="mb-4">
            Todo el tráfico en nuestro sitio está encriptado mediante SSL (HTTPS) para garantizar que nadie pueda interceptar los enlaces que estás descargando. Además, implementamos barreras de seguridad para proteger nuestros sistemas contra accesos no autorizados.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
