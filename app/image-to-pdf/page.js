'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import { Upload, FileDown, Loader2 } from 'lucide-react';

export default function ImageToPdf() {
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (e) => {
    let files = Array.from(e.target.files);
    
    if (images.length + files.length > 30) {
      alert("You can only upload up to 30 images at once to prevent browser memory issues.");
      files = files.slice(0, 30 - images.length);
    }

    if (files.length === 0) return;

    Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ src: e.target.result, name: file.name });
        reader.readAsDataURL(file);
      });
    })).then(newImages => {
      setImages(prev => [...prev, ...newImages]);
    });
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        if (i > 0) doc.addPage();
        
        const imgProps = doc.getImageProperties(images[i].src);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // If image is taller than page, we might want to scale it down to fit the page,
        // but for now this simple scaling fits the width.
        doc.addImage(images[i].src, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      
      doc.save('converted.pdf');
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <section className="hero">
          <h1 className="hero-title">Image to PDF</h1>
          <p className="hero-subtitle mt-4">Convert multiple images into a single PDF file instantly.</p>
        </section>

        <div className="input-card flex flex-col items-center">
           <input 
             type="file" 
             accept="image/*" 
             multiple 
             onChange={handleImageUpload} 
             id="image-upload" 
             style={{ display: 'none' }}
           />
           <label htmlFor="image-upload" className="btn btn-secondary cursor-pointer mb-4">
             <Upload size={18} /> Select Images
           </label>

           {images.length > 0 && (
             <div className="w-full mt-4">
               <h3 className="font-medium mb-4 text-secondary">Selected Images ({images.length})</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
                 {images.map((img, idx) => (
                   <div key={idx} className="flex flex-col items-center border border-border-color rounded-md p-2 bg-surface hover:border-primary transition-colors">
                     <img src={img.src} alt={img.name} style={{ width: '100%', height: 'auto', objectFit: 'contain', marginBottom: '0.5rem', maxHeight: '8rem' }} />
                     <span className="text-xs font-medium text-secondary truncate w-full text-center" title={img.name}>{img.name}</span>
                   </div>
                 ))}
               </div>
               <button 
                 onClick={generatePdf} 
                 disabled={isGenerating} 
                 className="btn btn-primary w-full justify-center py-3"
               >
                 {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
                 {isGenerating ? 'Generating PDF...' : 'Download PDF'}
               </button>
               <button 
                 onClick={() => setImages([])} 
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
