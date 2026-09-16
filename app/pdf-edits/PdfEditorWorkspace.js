'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import { 
  ChevronLeft, ChevronRight, Download, Pen, Eraser, 
  Trash2, X, Loader2, Type, Image as ImageIcon
} from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Helper to convert HEX to pdf-lib RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ) : rgb(0,0,0);
}

export default function PdfEditorWorkspace({ pdfFile, pdfName, onReset }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  
  // Tools: 'pen' | 'eraser' | 'text' | 'signature'
  const [activeTool, setActiveTool] = useState('pen');
  const [penColor, setPenColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  // Mathematical Actions tracking
  // actions = { [pageNumber]: [ { type: 'path', ... }, { type: 'text', ... } ] }
  const [actions, setActions] = useState({});
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // Temporary Interaction State
  const svgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [activeTextInput, setActiveTextInput] = useState(null); // { x, y }

  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  // Load handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };
  const onPageLoadSuccess = (page) => {
    setPageDimensions({ width: page.width, height: page.height });
  };
  const changePage = (offset) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages));
    setActiveTextInput(null);
  };

  // -------------------------
  // Interaction Logic
  // -------------------------
  const getCoordinates = (e) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * (pageDimensions.width / rect.width),
      y: (clientY - rect.top) * (pageDimensions.height / rect.height)
    };
  };

  const handlePointerDown = (e) => {
    // Ensure we only draw on the SVG background, not on top of active text inputs
    if (e.target.tagName.toLowerCase() === 'input') return;

    const coords = getCoordinates(e);
    if (!coords) return;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      setIsDrawing(true);
      setCurrentPath({
        type: 'path',
        color: activeTool === 'eraser' ? '#ffffff' : penColor,
        width: activeTool === 'eraser' ? 15 : strokeWidth,
        points: [coords]
      });
    } else if (activeTool === 'text') {
      setActiveTextInput({ x: coords.x, y: coords.y, text: '' });
    } else if (activeTool === 'signature') {
      // Open file dialog for signature
      if (fileInputRef.current) {
        fileInputRef.current.dataset.x = coords.x;
        fileInputRef.current.dataset.y = coords.y;
        fileInputRef.current.click();
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !currentPath) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    setCurrentPath(prev => ({
      ...prev,
      points: [...prev.points, coords]
    }));
  };

  const handlePointerUp = () => {
    if (isDrawing && currentPath) {
      setIsDrawing(false);
      // Save current path to actions
      setActions(prev => {
        const pageActions = prev[pageNumber] || [];
        return { ...prev, [pageNumber]: [...pageActions, currentPath] };
      });
      setCurrentPath(null);
    }
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && activeTextInput && activeTextInput.text.trim()) {
      setActions(prev => {
        const pageActions = prev[pageNumber] || [];
        return {
          ...prev,
          [pageNumber]: [...pageActions, {
            type: 'text',
            text: activeTextInput.text,
            color: penColor,
            size: 20, // default size
            x: activeTextInput.x,
            y: activeTextInput.y
          }]
        };
      });
      setActiveTextInput(null);
    } else if (e.key === 'Escape') {
      setActiveTextInput(null);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const x = parseFloat(e.target.dataset.x);
    const y = parseFloat(e.target.dataset.y);

    const reader = new FileReader();
    reader.onload = (ev) => {
      // Determine image dimensions to scale it reasonably
      const img = new Image();
      img.onload = () => {
        const maxWidth = 150;
        const scale = Math.min(1, maxWidth / img.width);
        setActions(prev => {
          const pageActions = prev[pageNumber] || [];
          return {
            ...prev,
            [pageNumber]: [...pageActions, {
              type: 'signature',
              dataUrl: ev.target.result,
              x: x,
              y: y,
              width: img.width * scale,
              height: img.height * scale
            }]
          };
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset
  };

  const clearCurrentPage = () => {
    setActions(prev => {
      const newActions = { ...prev };
      delete newActions[pageNumber];
      return newActions;
    });
  };

  // -------------------------
  // Helper to generate SVG Path string from points array
  // -------------------------
  const generateSvgPath = (points) => {
    if (!points || points.length === 0) return '';
    return `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  };

  // -------------------------
  // Export Logic using pdf-lib natively
  // -------------------------
  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfFile);
      const pages = pdfDoc.getPages();

      for (const [pageNumStr, pageActions] of Object.entries(actions)) {
        if (!pageActions || pageActions.length === 0) continue;
        
        const pageIndex = parseInt(pageNumStr) - 1;
        const page = pages[pageIndex];
        const { height: pdfHeight } = page.getSize();
        
        for (const action of pageActions) {
          if (action.type === 'path') {
            // pdf-lib's drawSvgPath correctly processes standard SVG paths
            // We just need to anchor it at the top-left (x: 0, y: pdfHeight)
            const pathStr = generateSvgPath(action.points);
            page.drawSvgPath(pathStr, {
              x: 0,
              y: pdfHeight, // SVG origin starts at top-left
              borderColor: hexToRgb(action.color),
              borderWidth: action.width,
            });
          } else if (action.type === 'text') {
            page.drawText(action.text, {
              x: action.x,
              // PDF y is bottom-up. Standard conversion from top-down Y:
              y: pdfHeight - action.y, 
              size: action.size,
              color: hexToRgb(action.color)
            });
          } else if (action.type === 'signature') {
            // Embed image (support PNG and JPEG)
            let imageEmbed;
            if (action.dataUrl.includes('image/png')) {
              imageEmbed = await pdfDoc.embedPng(action.dataUrl);
            } else {
              imageEmbed = await pdfDoc.embedJpg(action.dataUrl);
            }
            page.drawImage(imageEmbed, {
              x: action.x,
              // PDF y is bottom-up. Signature Y needs to account for its own height.
              y: pdfHeight - action.y - action.height,
              width: action.width,
              height: action.height,
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${pdfName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentPageActions = actions[pageNumber] || [];

  return (
    <div className="w-full max-w-5xl flex flex-col items-center bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
      
      {/* Top Toolbar */}
      <div className="w-full bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 z-10">
        
        {/* Left: Tools */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button 
              onClick={() => setActiveTool('pen')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${activeTool === 'pen' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Pen size={16} /> Pen
            </button>
            <div className="w-[1px] h-6 bg-gray-200"></div>
            <button 
              onClick={() => setActiveTool('eraser')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${activeTool === 'eraser' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              title="Eraser (White-out)"
            >
              <Eraser size={16} /> Eraser
            </button>
            <div className="w-[1px] h-6 bg-gray-200"></div>
            <button 
              onClick={() => setActiveTool('text')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${activeTool === 'text' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              title="Add Text"
            >
              <Type size={16} /> Text
            </button>
            <div className="w-[1px] h-6 bg-gray-200"></div>
            <button 
              onClick={() => setActiveTool('signature')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${activeTool === 'signature' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              title="Drop Signature"
            >
              <ImageIcon size={16} /> Signature
            </button>
          </div>

          {/* Color Picker (only show if pen or text active) */}
          <div className={`flex items-center gap-2 transition-opacity ${(activeTool === 'pen' || activeTool === 'text') ? 'opacity-100' : 'opacity-50 pointer-events-none hidden md:flex'}`}>
             <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
               {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308'].map(c => (
                 <button
                   key={c}
                   onClick={() => setPenColor(c)}
                   className={`w-6 h-6 rounded-md transition-transform ${penColor === c ? 'scale-110 ring-2 ring-offset-1 ring-blue-400' : 'hover:scale-105'}`}
                   style={{ backgroundColor: c }}
                 />
               ))}
             </div>
          </div>

          <button 
            onClick={clearCurrentPage}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Clear Current Page"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Center: Pagination */}
        <div className="flex items-center gap-4 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
          <button 
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-700" />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[70px] text-center">
            {numPages ? `${pageNumber} / ${numPages}` : '-- / --'}
          </span>
          <button 
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={20} className="text-slate-700" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <X size={16} /> Close
          </button>
          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="px-5 py-2 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-slate-800 transition-colors shadow-md flex items-center gap-2 disabled:opacity-70"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Hidden File Input for Signatures */}
      <input 
        type="file" 
        accept="image/png, image/jpeg" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleSignatureUpload} 
      />

      {/* PDF Viewer Area */}
      <div className="w-full flex justify-center bg-gray-100 overflow-auto p-4 md:p-8 min-h-[600px] relative select-none">
        
        {/* We use a wrapper to precisely overlay our SVG interactions on the PDF page */}
        <div 
          className="relative shadow-xl touch-none" 
          style={{ width: pageDimensions.width || 'auto', height: pageDimensions.height || 'auto' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerUp}
        >
          
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-20 text-slate-400 gap-3">
                <Loader2 size={24} className="animate-spin" /> Loading PDF...
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              className="bg-white pointer-events-none"
            />
          </Document>

          {/* Pure Vector SVG Overlay for Rendering and Drawing */}
          {pageDimensions.width > 0 && (
            <svg
              ref={svgRef}
              width={pageDimensions.width}
              height={pageDimensions.height}
              className="absolute top-0 left-0 z-20 cursor-crosshair w-full h-full"
            >
              {/* Render Saved Actions */}
              {currentPageActions.map((action, idx) => {
                if (action.type === 'path') {
                  return (
                    <path 
                      key={idx}
                      d={generateSvgPath(action.points)}
                      stroke={action.color}
                      strokeWidth={action.width}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                } else if (action.type === 'text') {
                  return (
                    <text 
                      key={idx}
                      x={action.x}
                      y={action.y}
                      fill={action.color}
                      fontSize={action.size}
                      fontFamily="sans-serif"
                    >
                      {action.text}
                    </text>
                  );
                } else if (action.type === 'signature') {
                  return (
                    <image 
                      key={idx}
                      href={action.dataUrl}
                      x={action.x}
                      y={action.y}
                      width={action.width}
                      height={action.height}
                    />
                  );
                }
                return null;
              })}

              {/* Render Currently Drawing Path */}
              {isDrawing && currentPath && (
                <path 
                  d={generateSvgPath(currentPath.points)}
                  stroke={currentPath.color}
                  strokeWidth={currentPath.width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          )}

          {/* HTML Overlay for active text input */}
          {activeTextInput && (
            <input 
              autoFocus
              type="text"
              value={activeTextInput.text}
              onChange={(e) => setActiveTextInput({ ...activeTextInput, text: e.target.value })}
              onKeyDown={handleTextSubmit}
              onBlur={() => setActiveTextInput(null)} // Cancel if clicked away
              className="absolute z-30 bg-transparent border-b-2 border-blue-500 outline-none text-[20px] font-sans"
              style={{ 
                left: activeTextInput.x, 
                top: activeTextInput.y - 20, // offset slightly to align baseline
                color: penColor,
                minWidth: '150px'
              }}
              placeholder="Type and press Enter..."
            />
          )}

        </div>
      </div>
    </div>
  );
}
