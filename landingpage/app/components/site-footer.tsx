const REPO = "https://github.com/lucaskaiut/horus";

export function SiteFooter() {
  return (
    <footer className="py-20 pt-28">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <p className="text-sm text-muted">
          Horus é software de código aberto no monorepositório do projeto. A aplicação principal (API + painel) está
          no mesmo repositório; esta pasta é só a landing de apresentação.
        </p>
        <p className="mt-6 text-sm">
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline decoration-faint underline-offset-4 hover:decoration-muted"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
