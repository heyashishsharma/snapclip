import Navbar from '../components/Navbar';

export const metadata = {
  title: "Privacy Policy | SnapClip",
  description: "Privacy Policy for SnapClip media tools.",
};

export default function PrivacyPolicy() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" style={{ alignItems: 'flex-start' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Privacy Policy</h1>
        
        <div className="input-card" style={{ maxWidth: '100%' }}>
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold mt-6 mb-2">1. Introduction</h2>
          <p className="mb-4 text-secondary">
            Welcome to SnapClip. We value your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we handle your data when you visit our website and use our tools (Video Downloader, Image to PDF, PDF to Image, Background Remover).
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">2. Data We Collect</h2>
          <p className="mb-4 text-secondary">
            SnapClip is designed to be a completely private and secure tool. We do not require registration, and we do not store or collect any personal information. 
            <br/><br/>
            <strong>Media Files:</strong> All image processing, background removal, and PDF conversions happen entirely in your local browser using client-side technologies. Your images and documents are <strong>never uploaded to our servers</strong>.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">3. Video Downloading</h2>
          <p className="mb-4 text-secondary">
            When you use the Video Downloader tool, the URL you provide is processed by our backend servers strictly for the purpose of retrieving the media stream. We do not store logs of the URLs you download or associate them with your IP address.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">4. Cookies and Analytics</h2>
          <p className="mb-4 text-secondary">
            We may use basic analytics tools that may use cookies to improve your experience. You can manage your cookie preferences through your browser settings.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">5. Contact Us</h2>
          <p className="mb-4 text-secondary">
            If you have any questions about this Privacy Policy, please contact us.
          </p>
        </div>
      </main>
    </div>
  );
}
