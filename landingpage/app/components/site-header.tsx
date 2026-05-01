const REPO = "https://github.com/lucaskaiut/horus";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-14 max-w-3xl flex-wrap items-center justify-between gap-y-2 px-6 py-3 md:px-8 md:py-0">
        <a href="#" className="text-[15px] font-medium tracking-tight text-foreground">
          Horus
        </a>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-xs text-muted sm:gap-x-8 sm:text-sm">
          <a href="#o-que-e" className="transition hover:text-foreground">
            Produto
          </a>
          <a href="#fluxo" className="transition hover:text-foreground">
            Fluxo
          </a>
          <a href="#capacidades" className="transition hover:text-foreground">
            Capacidades
          </a>
          <a href="#interface" className="transition hover:text-foreground">
            Interface
          </a>
          <a
            href={REPO}
            className="text-foreground underline decoration-faint underline-offset-4 transition hover:decoration-muted"
            target="_blank"
            rel="noreferrer"
          >
            Código
          </a>
        </nav>
      </div>
    </header>
  );
}
