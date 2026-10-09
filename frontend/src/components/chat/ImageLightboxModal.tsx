import React, { useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText = 'Screenshot'
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = altText.endsWith('.png') || altText.endsWith('.jpg') ? altText : `${altText || 'screenshot'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Container */}
      <div
        className="relative max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0f141d] border border-[#232e3d] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141b26] border-b border-[#232e3d]">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 truncate pr-4">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="truncate">{altText || 'Attached Screenshot'}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2838] transition-colors"
              title={isZoomed ? 'Actual size' : 'Fit to window'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2838] transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#1f2838] transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Content View */}
        <div className="relative overflow-auto flex items-center justify-center p-2 sm:p-4 min-h-[200px] max-h-[82vh] bg-[#090d14]">
          <img
            src={imageUrl}
            alt={altText}
            className={`transition-all duration-200 select-none ${
              isZoomed
                ? 'max-w-none cursor-zoom-out'
                : 'max-w-full max-h-[78vh] object-contain cursor-zoom-in rounded-lg shadow-md'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </div>
      </div>
    </div>
  );
};

