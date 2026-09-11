'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import snapclipLogo from '../../assets/snapcliplogo.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="navbar" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Mobile Hamburger Icon */}
      <button 
        className={`hamburger-btn md:hidden ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Logo */}
      <div className="nav-brand" style={{ display: 'flex', justifyContent: 'center' }}>
        <Link href="/">
          <Image 
            src={snapclipLogo} 
            alt="SnapClip Logo" 
            width={120} 
            height={120} 
            style={{ objectFit: 'contain', borderRadius: '8px' }} 
            priority
          />
        </Link>
      </div>

      {/* Desktop Links */}
      <nav className="desktop-nav">
        <Link href="/" className="desktop-link">Video Downloader</Link>
        <Link href="/image-to-pdf" className="desktop-link">Image to PDF</Link>
        <Link href="/pdf-to-image" className="desktop-link">PDF to Image</Link>
        <Link href="/bg-remover" className="desktop-link">BG Remover</Link>
      </nav>

      {/* Mobile Links Dropdown */}
      <div className={`mobile-dropdown ${isOpen ? 'open' : ''}`}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 1.5rem' }}>
          <Link href="/" className="mobile-nav-link" onClick={() => setIsOpen(false)}>Video Downloader</Link>
          <Link href="/image-to-pdf" className="mobile-nav-link" onClick={() => setIsOpen(false)}>Image to PDF</Link>
          <Link href="/pdf-to-image" className="mobile-nav-link" onClick={() => setIsOpen(false)}>PDF to Image</Link>
          <Link href="/bg-remover" className="mobile-nav-link" onClick={() => setIsOpen(false)}>BG Remover</Link>
        </nav>
      </div>

      {/* Placeholder to keep logo centered on mobile */}
      <div className="md:hidden" style={{ width: '44px' }}></div>
    </header>
  );
}
