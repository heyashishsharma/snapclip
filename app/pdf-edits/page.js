'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const MESSAGES = [
  "PDF editing is taking a little nap. Check back later!",
  "We're brewing up something awesome for PDF edits. Stay tuned!",
  "This space intentionally left blank (for now).",
  "PDF Editor: Coming soon to a browser near you!",
  "Pardon our dust! We're renovating the PDF Editor.",
  "Great things take time. Our PDF editor is one of them!"
];

export default function PdfEdits() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  }, []);

  return (
    <div className="app-container bg-[#f8fafc] min-h-screen flex flex-col">
      <Navbar />
      <main className="main-content flex-grow flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-6">PDF Edits</h1>
          <div className="bg-white px-8 py-6 rounded-2xl shadow-sm border border-gray-200 inline-block">
            <p className="text-lg text-slate-500 font-medium">
              {message || "Loading..."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
