import Navbar from '../components/Navbar';

export const metadata = {
  title: "Terms of Service | SnapClip",
  description: "Terms of Service for SnapClip media tools.",
};

export default function TermsOfService() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" style={{ alignItems: 'flex-start' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Terms of Service</h1>
        
        <div className="input-card" style={{ maxWidth: '100%' }}>
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold mt-6 mb-2">1. Acceptance of Terms</h2>
          <p className="mb-4 text-secondary">
            By accessing and using SnapClip ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">2. Use License</h2>
          <p className="mb-4 text-secondary">
            SnapClip provides tools for personal, non-commercial use. You may not use our services to infringe on copyrights or intellectual property rights. The video downloader tool is intended only for downloading publicly available videos that you have the right to download.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">3. Disclaimer</h2>
          <p className="mb-4 text-secondary">
            The materials on SnapClip's website are provided on an 'as is' basis. SnapClip makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">4. Limitations</h2>
          <p className="mb-4 text-secondary">
            In no event shall SnapClip or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SnapClip's website.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">5. Revisions and Errata</h2>
          <p className="mb-4 text-secondary">
            The materials appearing on SnapClip's website could include technical, typographical, or photographic errors. SnapClip does not warrant that any of the materials on its website are accurate, complete, or current.
          </p>
        </div>
      </main>
    </div>
  );
}
