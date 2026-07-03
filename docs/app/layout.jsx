// Import the framework straight from the repo's dist so the docs always
// reflect the current build — a node_modules copy goes stale because npm
// skips repacking file: deps when the version number hasn't changed.
import "../../dist/lunar.css";
import "./globals.css";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import LunaraInit from "../components/LunaraInit";

export const metadata = {
  title: {
    default: "Lunara CSS — night-sky CSS framework",
    template: "%s · Lunara CSS",
  },
  description:
    "Docs for Lunara CSS: a lightweight, utility-first CSS framework with a dark night-sky aesthetic. Pure CSS, zero build step, Tailwind preset included.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before hydration so there's no flash of the wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.setAttribute('data-theme',localStorage.getItem('lunar-theme')||'dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <LunaraInit />
        <div className="scroll-progress" aria-hidden="true"></div>
        <nav className="navbar sticky top-0 z-50">
          <Link href="/" className="navbar-brand">
            <span className="moon moon-live" style={{ "--moon-size": "1.5rem" }} aria-hidden="true"></span>
            <span className="text-shimmer font-bold">Lunara CSS</span>
          </Link>
          <div className="navbar-nav">
            <Link href="/docs" className="navbar-link">Docs</Link>
            <Link href="/docs/components" className="navbar-link">Components</Link>
            <Link href="/docs/effects" className="navbar-link">Effects</Link>
            <a
              href="https://github.com/AmbroziM25/Lunar_css"
              className="navbar-link"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </nav>
        {children}
        <footer className="border-t border-moon-800 py-10 mt-8">
          <div className="container flex items-center justify-between flex-wrap gap-4 text-sm text-muted">
            <span>MIT licensed. Built with Lunara CSS itself — this site is the demo.</span>
            <span className="flex items-center gap-2">
              <span className="moon moon-live" style={{ "--moon-size": "1rem" }} aria-hidden="true"></span>
              tonight&rsquo;s actual moon phase
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
