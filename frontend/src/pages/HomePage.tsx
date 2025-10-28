import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

function HomePage() {
  return (
    <div className="overflow-hidden">
      <Helmet>
        <title>Luxia Rituals — Elevated scalp care</title>
        <meta
          name="description"
          content="Luxia Rituals crafts science-backed scalp treatments for lustrous, resilient hair."
        />
      </Helmet>
      <section className="relative isolate flex min-h-[80vh] flex-col items-center justify-center bg-midnight text-champagne">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,199,200,0.3),_transparent_60%)]"
        ></div>
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
          <p className="uppercase tracking-[0.8em] text-champagne/60">Scalp Rituals</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl">
            Illuminate your hair from the root
          </h1>
          <p className="max-w-2xl text-base text-champagne/80 sm:text-lg">
            Our clinically proven serums, masks, and massage tools restore balance to the scalp biome, delivering shine and resilience worthy of a crown.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link to="/products" className="btn-primary">
              Explore collections
            </Link>
            <Link to="/checkout" className="btn-secondary">
              Reserve consultation
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <article className="rounded-3xl bg-white/70 p-8 shadow-2xl shadow-blush/30 backdrop-blur">
          <h2 className="font-display text-2xl">Precision-formulated for sensitive scalps</h2>
          <p className="mt-4 text-sm leading-relaxed text-midnight/80">
            Luxia’s bioactive concentrates feature marine stem cells, cold-pressed adaptogens, and dermatologically vetted peptides. Each formula is fragrance-free, color-safe, and tested on all hair textures.
          </p>
        </article>
        <article className="rounded-3xl bg-white/70 p-8 shadow-2xl shadow-blush/30 backdrop-blur">
          <h2 className="font-display text-2xl">Rituals designed by trichologists</h2>
          <p className="mt-4 text-sm leading-relaxed text-midnight/80">
            Our experts blend holistic massage therapy with targeted actives to calm inflammation, reduce shedding, and accelerate healthy growth cycles.
          </p>
        </article>
      </section>
      <section className="bg-white/80 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl text-center">Signature Rituals</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-midnight/70">
            From detoxifying scalp masks to overnight serums, our products are meticulously packaged for elevated vanities and travel rituals alike.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredRituals.map((ritual) => (
              <article
                key={ritual.name}
                className="group flex flex-col overflow-hidden rounded-3xl border border-champagne/40 bg-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="aspect-[4/5] w-full bg-gradient-to-br from-champagne via-blush to-white">
                  <img
                    src={ritual.image}
                    alt={ritual.name}
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h3 className="font-display text-lg">{ritual.name}</h3>
                  <p className="text-sm text-midnight/70">{ritual.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const featuredRituals = [
  {
    name: 'Celestial Detox Mask',
    description: 'Volcanic enzymes and willow bark gently exfoliate buildup while micro algae replenish essential minerals.',
    image:
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Nocturne Renewal Serum',
    description: 'Peptide-rich serum that floods the follicles with antioxidants and soothing ceramides overnight.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Luminous Scalp Tonic',
    description: 'Cooling tonic balancing sebum and pH while infusing shine with sustainably sourced sea kelp.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'
  }
];

export default HomePage;
