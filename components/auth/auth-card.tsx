import * as React from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function AuthCard({
  title,
  description,
  children,
  showImage = true,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  showImage?: boolean;
}) {
  return (
    <div className={`w-full ${showImage ? "max-w-[1000px] grid grid-cols-1 md:grid-cols-2" : "max-w-[500px]"} bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden`}>
      {/* Left Side: Form */}
      <div className="p-8 md:p-12 flex flex-col justify-center">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-green-600 font-bold mb-2">E-Tontine</h1>
          <p className="font-sans text-base text-slate-500">
            {title === "Connexion" ? "Bon retour parmi nous. Gérez vos finances communautaires." : description}
          </p>
        </div>
        
        {children}
      </div>

      {/* Right Side: Illustration/Branding */}
      {showImage && (
        <div className="hidden md:block relative bg-green-700 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80"
            alt="Collaboration et finances"
            fill
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-green-800/90 to-transparent pointer-events-none"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-lg shadow-lg">
              <ShieldCheck className="w-8 h-8 text-green-400 mb-4" />
              <h2 className="font-heading text-xl font-bold mb-2 text-white">Sécurité de niveau bancaire</h2>
              <p className="font-sans text-sm text-green-50">
                Vos fonds communautaires sont protégés par des protocoles de chiffrement avancés, garantissant une transparence totale pour tous les membres de votre tontine.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
