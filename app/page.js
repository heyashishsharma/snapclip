'use client';

import { useState } from 'react';
import { Download, Link as LinkIcon, AlertCircle, Loader2, PlayCircle, Video, Camera, Music } from 'lucide-react';
import Navbar from './components/Navbar';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');

  const fetchVideoInfo = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoadingInfo(true);
    setError(null);
    setVideoInfo(null);

    try {
      const res = await fetch('/api/video/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch video info');

      setVideoInfo(data);
      if (data.formats && data.formats.length > 0) {
        setSelectedFormat(data.formats[0].format_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleDownload = () => {
    if (!videoInfo || !selectedFormat) return;

    // Direct redirect to API for download
    const downloadUrl = `/api/video/download?url=${encodeURIComponent(url)}&format_id=${encodeURIComponent(selectedFormat)}`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">


        {/* Hero Section */}
        <section className="hero">

          <h1 className="hero-title">
            Download Videos.<br />
            <span className="gradient-text">Simple & Fast.</span>
          </h1>
          <p className="hero-subtitle mt-4">
            Paste a video link and download your content in seconds.<br />
            High quality, instant processing, and no registration required.
          </p>
        </section>

        {/* Input Card */}
        <div className="input-card">
          <span className="input-label">VIDEO LINK</span>

          <form onSubmit={fetchVideoInfo} className="input-group">
            <div className="input-wrapper">
              <LinkIcon size={20} color="#94a3b8" />
              <input
                type="url"
                className="input-field"
                placeholder="Paste video link here (e.g. https://...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoadingInfo || !url.trim()}
              style={{ minWidth: '130px' }}
            >
              {isLoadingInfo ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <><Download size={18} /> Download</>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl flex items-center gap-2" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
              <AlertCircle size={20} />
              <span className="font-medium text-sm">{error}</span>
            </div>
          )}

          <div className="supported-platforms">
            <span className="font-medium text-secondary">Supported:</span>
            <div className="platform-icons">
              <div className="platform-tag">
                <Video size={14} color="#ef4444" /> YouTube
              </div>
              <div className="platform-tag">
                <Music size={14} color="#000000" /> TikTok
              </div>
              <div className="platform-tag">
                <Camera size={14} color="#e1306c" /> Instagram
              </div>
            </div>
            <span className="text-secondary">... and multiple other platforms.</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingInfo && (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} size={32} />
            <p className="text-sm text-secondary font-medium">Fetching media details...</p>
          </div>
        )}

        {/* Video Info & Quality Selection Card */}
        {videoInfo && !isLoadingInfo && (
          <div className="video-info-card">
            <div className="video-info-grid">
              <div className="thumbnail-container">
                {videoInfo.thumbnail ? (
                  <img src={videoInfo.thumbnail} alt={videoInfo.title} />
                ) : (
                  <div className="flex items-center justify-center w-full h-full" style={{ color: 'var(--border-color)' }}>
                    <PlayCircle size={48} opacity={0.5} />
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <h3 className="mb-2 text-main" style={{ fontSize: '1.25rem', lineHeight: '1.4' }}>
                  {videoInfo.title || 'Untitled Media'}
                </h3>
                <p className="text-sm text-secondary mb-4 font-medium">
                  {videoInfo.duration ? `${Math.floor(videoInfo.duration / 60)}:${String(videoInfo.duration % 60).padStart(2, '0')} • ` : ''}
                  {videoInfo.extractor_key}
                </p>

                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-2 text-secondary uppercase tracking-wide">
                    Select Quality
                  </label>
                  <div className="select-container">
                    <select
                      className="select-field"
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                    >
                      {videoInfo.formats.map((format) => {
                        const isAudioOnly = format.vcodec === 'none';
                        const hasAudio = format.acodec !== 'none';
                        const label = format.format_note || format.resolution || (isAudioOnly ? 'Audio Only' : 'Unknown');
                        const size = format.filesize ? ` - ${(format.filesize / 1024 / 1024).toFixed(1)} MB` : '';

                        let audioStatus = '';
                        if (!isAudioOnly) {
                          audioStatus = hasAudio ? ' [Audio Enabled]' : ' [Audio Disabled]';
                        }

                        return (
                          <option key={format.format_id} value={format.format_id}>
                            {isAudioOnly ? '🎵 ' : '🎬 '}
                            {label} ({format.ext}){audioStatus}{size}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="btn btn-primary w-full mt-2"
                  disabled={!selectedFormat}
                >
                  <Download size={18} />
                  Download Direct File
                </button>
              </div>
            </div>
          </div>
        )}


      </main>
    </div>
  );
}
