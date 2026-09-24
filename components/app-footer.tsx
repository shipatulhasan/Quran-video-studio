const YEAR = new Date().getFullYear();

const LINKS = [
  { label: "Documentation", href: "#" },
  { label: "CSV format", href: "#" },
  { label: "Report an issue", href: "#" },
];

export function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand + tagline */}
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">SyncCaster</p>
            <p className="text-xs text-muted-foreground">
              Sync timed overlays to any video — produce broadcast-ready content in minutes.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            {LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-5 border-t pt-4 text-xs text-muted-foreground">
          © {YEAR} SyncCaster. Built with Next.js, FFmpeg & Prisma.
        </div>
      </div>
    </footer>
  );
}
