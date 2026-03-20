import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Soma AI</p>
          <h1>Next.js wrapper for the Unity WebGL build</h1>
          <p className="lede">
            The embedded frame below serves the exported Unity build from
            <code className="code">Builds/SoraAI_HTML</code>.
          </p>
        </div>
        <div className="actions">
          <Link className="button" href="/unity/index.html" target="_blank">
            Open full window
          </Link>
        </div>
      </header>

      <section className="frame">
        <div className="frame-header">
          <div>
            <p className="label">Embedded player</p>
            <p className="hint">Loads directly from the Unity build output</p>
          </div>
          <a href="/unity/index.html" target="_blank" rel="noreferrer">
            Pop out
          </a>
        </div>
        <div className="iframe-wrapper">
          <iframe
            title="Soma AI WebGL Build"
            src="/unity"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>
    </main>
  );
}



