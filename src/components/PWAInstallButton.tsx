import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallButtonProps {
  className?: string;
  appLogo?: string;
  appName?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  appLogo,
  appName = 'RT.008 App'
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // If browser doesn't offer beforeinstallprompt (iOS or Chrome ambient prompt suppressed)
      setShowGuideModal(true);
    }
  };

  // If already running inside standalone app, do not show install prompt
  if (isInstalled) {
    return null;
  }

  const logoSrc = appLogo || '/icon-192.png';

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${
          deferredPrompt
            ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        } ${className}`}
        title="Pasang aplikasi ke layar utama HP / Komputer"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Pasang Aplikasi</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* Guide Modal for iOS or manual install */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 flex flex-col relative text-slate-800">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon & Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-950 p-1 border border-slate-200 shadow-md shrink-0">
                <img
                  src={logoSrc}
                  alt={appName}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  Pasang {appName}
                </h3>
                <p className="text-xs text-slate-500">
                  Aplikasi akan terpasang di layar utama HP dengan logo resmi
                </p>
              </div>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <span>Petunjuk Pasang di iPhone / iPad:</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    Ketuk tombol <span className="font-bold text-slate-900">Bagikan (Share)</span>{' '}
                    <Share2 className="w-3.5 h-3.5 inline text-sky-600" /> di bilah bawah browser Safari.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    Gulir ke bawah dan ketuk{' '}
                    <span className="font-bold text-slate-900">
                      "Tambahkan ke Layar Utama" (Add to Home Screen)
                    </span>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-sky-600" />.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    Ketuk <span className="font-bold text-slate-900">Tambah (Add)</span> di sudut kanan atas. Logo aplikasi akan langsung tampil di beranda HP Anda.
                  </div>
                </div>
              </div>
            ) : (
              /* Android Chrome / Edge Instructions */
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <span>Petunjuk Pasang di Android / Google Chrome:</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    Ketuk tombol menu <span className="font-bold text-slate-900">Titik Tiga (⋮)</span> di kanan atas browser Google Chrome.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    Pilih opsi <span className="font-bold text-slate-900">"Pasang aplikasi" (Install app)</span> atau <span className="font-bold text-slate-900">"Tambahkan ke Layar Utama"</span>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    Konfirmasi <span className="font-bold text-slate-900">Pasang (Install)</span>. Logo aplikasi resmi akan terpasang di HP secara otomatis!
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Mengerti &amp; Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
