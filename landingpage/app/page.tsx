import Image from "next/image";

import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import dashboardScreenshot from "@/app/assets/horus-dashboard.png";
import listScreenshot from "@/app/assets/horus-list.png";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">{children}</p>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-3xl px-6 pb-24 pt-24 md:px-8 md:pt-28">
        <section className="pt-10 md:pt-14" aria-labelledby="hero-heading">
          <h1 id="hero-heading" className="max-w-[14ch] text-[clamp(2.5rem,6vw,3.75rem)] font-medium leading-[1.05] tracking-tight">
            Visibilidade sobre o que acontece nos seus sistemas.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
            <strong className="font-medium text-foreground">Horus</strong> reúne ingestão de eventos, indexação
            pesquisável e um painel para explorar volume, severidade e contexto — pensado para equipes que tratam logs
            no dia a dia, não como projeto à parte.
          </p>
        </section>

        <section id="o-que-e" className="mt-28 scroll-mt-24 md:scroll-mt-28">
          <SectionLabel>O que é</SectionLabel>
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">Plataforma de coleta e consulta de logs</h2>
          <div className="mt-8 space-y-6 text-base leading-relaxed text-muted md:text-[17px]">
            <p>
              Seus serviços enviam registros estruturados para uma API. A fila processa cada evento e persiste no
              OpenSearch, onde ficam disponíveis para busca por texto, filtros por nível, ambiente, origem e intervalo
              de tempo. Uma aplicação web autenticada oferece resumo agregado (dashboard) e listagem detalhada com
              paginação.
            </p>
            <p>
              O desenho é monorepositório: <span className="font-mono text-[0.92em] text-foreground/90">Laravel</span>{" "}
              expõe a API e a autenticação Sanctum; <span className="font-mono text-[0.92em] text-foreground/90">Next.js</span>{" "}
              atua como BFF e interface; <span className="font-mono text-[0.92em] text-foreground/90">OpenSearch</span>{" "}
              armazena e consulta os documentos. Redis e MySQL costumam entrar para filas, cache e usuários.
            </p>
          </div>
        </section>

        <section id="fluxo" className="mt-28 scroll-mt-24 md:scroll-mt-28">
          <SectionLabel>Fluxo de dados</SectionLabel>
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">Do envio à resposta</h2>
          <ol className="mt-10 space-y-10">
            {[
              {
                step: "01",
                title: "Ingestão",
                body: "Clientes enviam logs com POST /api/logs. A API aceita o pedido e enfileira o trabalho — a ingestão não bloqueia o cliente na escrita no índice.",
              },
              {
                step: "02",
                title: "Processamento",
                body: "Um worker consome a fila (por exemplo em Redis), normaliza o payload e indexa em lote no OpenSearch, mantendo o padrão de índices logs-*.",
              },
              {
                step: "03",
                title: "Consulta",
                body: "GET /api/logs devolve listagens com meta de paginação e filtros. GET /api/logs/summary agrega contagens para gráficos e KPIs no dashboard.",
              },
              {
                step: "04",
                title: "Interface",
                body: "O usuário faz login na web; o Next propaga o token em cookie HttpOnly e encaminha chamadas à API. Dashboard e listagem usam a mesma fonte de dados.",
              },
            ].map((item) => (
              <li key={item.step} className="grid gap-3 md:grid-cols-[4.5rem_1fr] md:gap-8">
                <span className="font-mono text-sm text-muted tabular-nums">{item.step}</span>
                <div>
                  <h3 className="text-lg font-medium text-foreground">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="capacidades" className="mt-28 scroll-mt-24 md:scroll-mt-28">
          <SectionLabel>Capacidades</SectionLabel>
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">O que pode esperar do produto</h2>
          <ul className="mt-10 grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
            {[
              {
                title: "Dashboard operacional",
                text: "Histogramas por dia, distribuição por nível, canais e destaques de volume — dados calculados no servidor a partir das agregações.",
              },
              {
                title: "Listagem e filtros",
                text: "Exploração paginada com filtros por severidade, ambiente, origem e texto. Adequado a investigações rápidas sem SQL nem consola do cluster.",
              },
              {
                title: "Autenticação integrada",
                text: "Login com canal interno e tokens Sanctum; contas são criadas fora da aplicação (sem cadastro público). A web mantém a sessão em cookie HttpOnly.",
              },
              {
                title: "Escala de dados de teste",
                text: "Seed opcional gera grandes volumes no OpenSearch para validar desempenho de busca e de interface antes de produção.",
              },
            ].map((item) => (
              <li key={item.title}>
                <h3 className="text-base font-medium text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted md:text-[15px]">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="interface" className="mt-28 scroll-mt-24 md:scroll-mt-28" aria-labelledby="interface-heading">
          <SectionLabel>Interface</SectionLabel>
          <h2 id="interface-heading" className="text-2xl font-medium tracking-tight md:text-3xl">
            O painel em produção
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted md:text-[17px]">
            Capturas reais da aplicação web: resumo operacional e exploração linha a linha dos eventos.
          </p>

          <div className="mt-12 space-y-14 md:space-y-16">
            <figure className="m-0">
              <Image
                src={dashboardScreenshot}
                alt="Dashboard Horus com KPIs, gráficos de volume por dia e distribuição por nível"
                sizes="(max-width: 768px) 100vw, 42rem"
                className="h-auto w-full"
                placeholder="blur"
                priority
              />
              <figcaption className="mt-3 text-sm leading-snug text-muted">
                Dashboard — agregações e visão geral do período.
              </figcaption>
            </figure>

            <figure className="m-0">
              <Image
                src={listScreenshot}
                alt="Listagem de logs Horus com colunas, níveis e linha selecionada"
                sizes="(max-width: 768px) 100vw, 42rem"
                className="h-auto w-full"
                placeholder="blur"
              />
              <figcaption className="mt-3 text-sm leading-snug text-muted">
                Listagem — filtros, paginação e detalhe do evento.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-28" aria-labelledby="quem-heading">
          <SectionLabel>Para quem</SectionLabel>
          <h2 id="quem-heading" className="text-2xl font-medium tracking-tight md:text-3xl">
            Equipes de plataforma, backend e operações
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-[17px]">
            Quando você precisa de um lugar único para correlacionar erros, inspecionar ambientes e comunicar números
            a stakeholders — sem montar uma suite comercial inteira no primeiro dia — um núcleo API + busca + UI como o
            Horus serve como base sólida.
          </p>
        </section>

        <section className="mt-28 pb-4" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="sr-only">
            Começar
          </h2>
          <p className="text-lg font-medium tracking-tight text-foreground md:text-xl">Pronto a explorar o código?</p>
          <p className="mt-3 max-w-lg text-muted">
            O README do repositório descreve Docker Compose, variáveis de ambiente, endpoints e publicação. A aplicação
            web principal corre em porto distinto desta landing.
          </p>
          <p className="mt-8">
            <a
              href="https://github.com/lucaskaiut/horus"
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-base font-medium text-foreground underline decoration-muted underline-offset-[6px] transition hover:decoration-foreground"
            >
              Abrir repositório no GitHub
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
