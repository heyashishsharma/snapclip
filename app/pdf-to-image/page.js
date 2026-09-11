'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import { Upload, FileDown, Loader2 } from 'lucide-react';

export default function PdfToImage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);
    setIsProcessing(true);
    setImages([]);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      
      const fileUrl = URL.createObjectURL(file);
      const pdf = await pdfjsLib.getDocument({ url: fileUrl }).promise;
      const totalPages = pdf.numPages;
      const extractedImages = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        const imgUrl = canvas.toDataURL('image/jpeg', 0.9);
        extractedImages.push({ url: imgUrl, name: `${file.name.replace('.pdf', '')}-page-${pageNum}.jpg` });
      }

      setImages(extractedImages);
    } catch (error) {
      console.error("Error processing PDF", error);
      alert("Failed to process PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    images.forEach((img, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = img.url;
        a.download = img.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 300);
    });
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <section className="hero">
          <h1 className="hero-title">PDF to Image</h1>
          <p className="hero-subtitle mt-4">Extract all pages from a PDF document as high-quality images.</p>
        </section>

        <div className="input-card flex flex-col items-center">
           <input 
             type="file" 
             accept="application/pdf" 
             onChange={handlePdfUpload} 
             id="pdf-upload" 
             style={{ display: 'none' }}
           />
           <label htmlFor="pdf-upload" className="btn btn-secondary cursor-pointer mb-4">
             <Upload size={18} className="mr-2" /> Select PDF File
           </label>

           {isProcessing && (
             <div className="mt-8 flex flex-col items-center justify-center gap-4 py-8">
               <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} size={32} />
               <p className="text-sm text-secondary font-medium">Extracting images... (This might take a moment)</p>
             </div>
           )}

           {images.length > 0 && !isProcessing && (
             <div className="w-full mt-4">
               <h3 className="font-medium mb-4 text-secondary">Extracted Pages ({images.length})</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                 {images.map((img, idx) => (
                   <div key={idx} className="flex flex-col items-center border border-border-color rounded-md p-2 bg-surface hover:border-primary transition-colors">
                     <img src={img.url} alt={`Page ${idx + 1}`} className="w-full h-auto object-contain mb-2" />
                     <span className="text-xs font-medium text-secondary">Page {idx + 1}</span>
                   </div>
                 ))}
               </div>
               <button 
                 onClick={handleDownloadAll} 
                 className="btn btn-primary w-full justify-center py-3"
               >
                 <FileDown size={18} className="mr-2" /> Download All Images
               </button>
               <button 
                 onClick={() => { setImages([]); setPdfFile(null); }} 
                 className="btn btn-ghost w-full justify-center mt-2 text-sm"
               >
                 Clear
               </button>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
