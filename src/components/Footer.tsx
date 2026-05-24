import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-bold">
          <span>ByteDownloader HD</span>
        </div>

        {/* Middle Credits */}
        <div className="text-xs text-slate-500 dark:text-slate-500 text-center md:text-left font-medium">
          © {new Date().getFullYear()} ByteDownloader. Todos los derechos reservados. No almacenamos contenido en nuestros servidores.
        </div>

        {/* Right Side Links */}
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
          <a 
            href="/terms" 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Términos de Servicio
          </a>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <a 
            href="/privacy" 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Privacidad
          </a>
        </div>
        
      </div>
    </footer>
  );
}
