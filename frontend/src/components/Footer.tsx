function Footer() {
  return (
    <footer className="bg-midnight text-champagne">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="font-display text-xl uppercase tracking-[0.3em]">Luxia</h2>
            <p className="mt-4 max-w-xs text-sm text-champagne/80">
              Premium scalp and hair-care rituals crafted in small batches with clinical-grade botanicals.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest">Visit</h3>
            <p className="mt-4 text-sm text-champagne/80">
              Atelier Luxia
              <br />
              88 Crown Street
              <br />
              New York, NY 10013
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest">Stay in touch</h3>
            <p className="mt-4 text-sm text-champagne/80">
              hello@luxiarituals.com
              <br />
              (212) 555-0199
            </p>
          </div>
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-champagne/60">
          © {new Date().getFullYear()} Luxia Rituals. Crafted with reverence for healthy scalps.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
