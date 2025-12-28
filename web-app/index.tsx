"use client";

export default function IndexPage() {
  return (
    <div className="page">
      {/* HEADER */}
      <div className="page-header">
        <p className="page-kicker">The Creator’s Forge</p>
        <h1 className="page-title">
          Upload. Authenticate.
          <span className="hero-highlight">Own your universe.</span>
        </h1>
        <p className="page-subtitle">
          Art‑hur protects your art, books, and films with originality scans,
          cryptographic fingerprints, and your own certification seal.
        </p>
      </div>

      {/* HERO SECTION */}
      <section className="hero">
        <div>
          <p className="hero-body">
            Your creative identity deserves protection. Art‑hur gives you
            authorship proof, originality verification, and a living certificate
            for every piece you create.
          </p>

          <div className="hero-cta">
            <a href="/login" className="btn-primary">Get Started</a>
            <a href="/explore" className="btn-ghost">Explore</a>
          </div>
        </div>

        <div className="hero-orbit">
          <div className="hero-orbit-inner">
            Your work is scanned, hashed, and certified with the Art‑hur Seal.
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginTop: "3rem" }}>
        <div className="page-header">
          <p className="page-kicker">How it works</p>
          <h2 className="page-title">From upload to authenticated asset</h2>
          <p className="page-subtitle">
            Art‑hur gives creators proof of originality, ownership, and authorship.
          </p>
        </div>

        <div className="grid grid-3">
          <div className="card">
            <div className="card-label">Step 1</div>
            <div className="card-title">Upload your piece</div>
            <p className="card-body">Art, books, or films — all supported.</p>
          </div>

          <div className="card">
            <div className="card-label">Step 2</div>
            <div className="card-title">Scan the web</div>
            <p className="card-body">
              Automated originality checks across the public internet.
            </p>
          </div>

          <div className="card">
            <div className="card-label">Step 3</div>
            <div className="card-title">Strike the Art‑hur Seal</div>
            <p className="card-body">
              Your work receives a live certificate proving authorship.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
