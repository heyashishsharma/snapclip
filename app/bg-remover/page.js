'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import { Upload, FileDown, Loader2, Sparkles } from 'lucide-react';

export default function BgRemover() {
  const [image, setImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState('Initializing...');
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage({ src: e.target.result, name: file.name, file });
    reader.readAsDataURL(file);
    setResultImage(null);
  };

  const handleImageUpload = async (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeBackground = async () => {
    if (!image) return;
    setIsProcessing(true);
    setDownloadProgress(0);
    setProcessStatus('Initializing...');

    try {
      const config = {
        model: 'isnet', // Enforce the highest quality model for best results
        progress: (key, current, total) => {
          if (key.includes('fetch')) setProcessStatus('Downloading AI Model...');
          else if (key.includes('compute')) setProcessStatus('Removing Background...');
          else setProcessStatus('Processing...');
          
          if (total > 0) {
            setDownloadProgress(Math.round((current / total) * 100));
          }
        },
        output: { format: 'image/png' }
      };

      // Sanitize the input by converting it to a standard PNG Blob via Canvas.
      // This fixes crashes on image/bmp and other formats unsupported by canvas.toBlob.
      const sanitizedBlob = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load image for sanitization'));
        img.src = image.src;
      });

      const { removeBackground: imglyRemoveBackground } = await import('@imgly/background-removal');
      const imageBlob = await imglyRemoveBackground(sanitizedBlob, config);
      const url = URL.createObjectURL(imageBlob);
      setResultImage(url);
    } catch (error) {
      console.error("Error removing background", error);
      alert("Failed to remove background. Ensure you have a stable internet connection for downloading the AI models on the first run.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `bg-removed-${image.name.replace(/\.[^/.]+$/, "")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <section className="hero">
          <h1 className="hero-title">Background Remover</h1>
          <p className="hero-subtitle mt-4">Instantly remove backgrounds from images using AI directly in your browser.</p>
        </section>

        <div 
          className={`input-card flex flex-col items-center transition-all ${isDragging ? 'ring-2 ring-[var(--primary)] bg-[var(--primary)]/5' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
           {!image ? (
             <div className="flex flex-col items-center justify-center py-10 w-full min-h-[200px]">
               <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleImageUpload} 
                 id="image-upload" 
                 style={{ display: 'none' }}
               />
               <span className="text-secondary font-medium mb-4">Drag & Drop Image Here</span>
               <label htmlFor="image-upload" className="btn btn-secondary cursor-pointer">
                 <Upload size={18} className="mr-2" /> Upload Image
               </label>
             </div>
           ) : (
             <div className="w-full flex flex-col items-center">
               <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-center mb-8">
                 {/* Original Image */}
                 <div className="flex flex-col items-center">
                   <h3 className="font-medium mb-3 text-secondary">Original</h3>
                    <div className="relative rounded-xl border-2 border-dashed border-border-color overflow-hidden bg-surface flex items-center justify-center" style={{ width: '100%', maxWidth: '256px', aspectRatio: '1/1' }}>
                      <img src={image.src} alt="Original" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                 </div>

                 {/* Processed Image */}
                 <div className="flex flex-col items-center">
                   <h3 className="font-medium mb-3 text-secondary">Result</h3>
                    <div className="relative rounded-xl border-2 border-dashed border-border-color overflow-hidden flex items-center justify-center"
                         style={{
                           width: '100%', maxWidth: '256px', aspectRatio: '1/1',
                           backgroundColor: '#f8fafc',
                           backgroundImage: 'repeating-conic-gradient(#e2e8f0 0% 25%, transparent 0% 50%)',
                           backgroundSize: '20px 20px',
                         }}>
                     {isProcessing ? (
                       <div className="flex flex-col items-center justify-center p-4 text-center bg-white/80 rounded-lg shadow-sm w-full h-full">
                         <Loader2 className="animate-spin text-primary mb-3" size={32} />
                         <span className="text-sm font-medium text-main mb-1">{processStatus}</span>
                         <div className="w-full rounded-full h-2 mt-3" style={{ backgroundColor: '#e2e8f0', width: '80%' }}>
                           <div className="h-2 rounded-full" style={{ width: `${downloadProgress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.3s' }}></div>
                         </div>
                         <span className="text-xs font-semibold text-primary mt-2">{downloadProgress}%</span>
                       </div>
                     ) : resultImage ? (
                        <img src={resultImage} alt="Background Removed" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                     ) : (
                       <div className="flex flex-col items-center justify-center text-secondary">
                         <Sparkles size={32} className="mb-2 opacity-50" />
                         <span className="text-sm">Ready to process</span>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                 {!resultImage && (
                   <button 
                     onClick={removeBackground} 
                     disabled={isProcessing} 
                     className="btn btn-primary flex-1 justify-center"
                   >
                     {isProcessing ? <Loader2 className="animate-spin mr-2" size={18} /> : <Sparkles size={18} className="mr-2" />}
                     {isProcessing ? 'Removing...' : 'Remove Background'}
                   </button>
                 )}
                 {resultImage && (
                   <button 
                     onClick={downloadResult} 
                     className="btn btn-primary flex-1 justify-center"
                   >
                     <FileDown size={18} className="mr-2" /> Download PNG
                   </button>
                 )}
                 <button 
                   onClick={() => { setImage(null); setResultImage(null); }} 
                   disabled={isProcessing}
                   className="btn btn-secondary flex-1 justify-center"
                 >
                   Upload New
                 </button>
               </div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
