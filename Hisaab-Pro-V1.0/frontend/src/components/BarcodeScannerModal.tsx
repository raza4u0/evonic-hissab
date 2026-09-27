import React, { useEffect, useRef, useState } from 'react';
import { Camera, QrCode, X, Zap, Volume2, VolumeX, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
  continuous?: boolean; // Keep scanner open after scan for multi-item scanning
}

export const playBeepSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1800, audioCtx.currentTime); // High pitched scan beep
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (err) {
    console.warn('AudioContext beep error:', err);
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Barcode Scanner',
  subtitle = 'Point camera at product barcode or use hardware scanner',
  continuous = false
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-barcode-reader';
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Focus manual input on open for hardware scanners
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Handle Html5Qrcode lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      setCameraError(null);
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')) || devices[0];
          setSelectedCameraId(backCam.id);
          initCamera(backCam.id);
        } else {
          setCameraError('No camera devices detected. You can still use a hardware scanner or type the barcode.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Camera access error:', err);
        setCameraError('Camera permission denied or unavailable. Hardware scanner input is still active.');
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const initCamera = async (cameraId: string) => {
    await stopScanner();
    try {
      const html5Qrcode = new Html5Qrcode(scannerContainerId);
      html5QrcodeRef.current = html5Qrcode;

      await html5Qrcode.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.777778
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Frame scan error (normal when no barcode in frame)
        }
      );
      setIsScanning(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn('Failed to start barcode camera:', err);
      setCameraError('Failed to start camera feed. Please check camera permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
      html5QrcodeRef.current = null;
    }
    setIsScanning(false);
  };

  const handleDetectedCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    if (soundEnabled) {
      playBeepSound();
    }

    setLastScanned(trimmed);
    onScan(trimmed);

    if (!continuous) {
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetectedCode(manualCode.trim());
      setManualCode('');
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const camId = e.target.value;
    setSelectedCameraId(camId);
    if (camId) {
      initCamera(camId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Scan Beep' : 'Enable Scan Beep'}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Live Scanner Viewport */}
          <div className="relative bg-slate-950 rounded-xl border-2 border-slate-800 overflow-hidden min-h-[220px] flex items-center justify-center">
            <div id={scannerContainerId} className="w-full h-full min-h-[220px] object-cover" />

            {/* Viewfinder Scan Overlay Lines */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-[260px] h-[140px] border-2 border-dashed border-emerald-400 rounded-lg relative flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {/* Animated laser line */}
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 mt-2 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur">
                  Align Barcode Inside Frame
                </span>
              </div>
            )}

            {/* Error state display */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400" />
                <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
              </div>
            )}
          </div>

          {/* Camera Selection if multiple cameras exist */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Camera Device:</span>
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.substring(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Last Scanned Banner */}
          {lastScanned && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Scanned Code: <strong className="font-mono text-emerald-900 dark:text-emerald-200">{lastScanned}</strong></span>
            </div>
          )}

          {/* Manual / Hardware Scanner Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Hardware Scanner / Manual Barcode Input
            </label>
            <div className="flex space-x-2">
              <input
                ref={manualInputRef}
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Scan with USB reader or type code (e.g. 629110001234)"
                className="flex-1 text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
              >
                Add Code
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              💡 Connected USB hardware scanners automatically submit barcode text directly into this field.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
