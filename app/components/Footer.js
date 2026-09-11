import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">&copy; {new Date().getFullYear()} SnapClip. All rights reserved.</p>
        <div className="footer-links">
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
          <Link href="/terms" className="footer-link">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
