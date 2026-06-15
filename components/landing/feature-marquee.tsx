import * as React from "react";
import Image from "next/image";

export type MarqueeCard = {
  title: string;
  text: string;
  image: string;
};

/**
 * Carrousel infini fluide : les cartes défilent en continu (animation CSS GPU).
 * Chaque carte porte une image illustrant son propos. La lecture se met en pause au survol.
 */
export function FeatureMarquee({ cards }: { cards: MarqueeCard[] }) {
  // On duplique la liste pour une boucle sans couture (translateX -50%).
  const loop = [...cards, ...cards];

  return (
    <div
      className="marquee-pause relative w-full overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <div className="animate-marquee flex w-max gap-4 py-2 md:gap-5">
        {loop.map((card, i) => (
          <article
            key={`${card.title}-${i}`}
            className="group relative w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border-light bg-surface-container-lowest shadow-card sm:w-[300px]"
          >
            <div className="relative h-40 w-full overflow-hidden">
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes="300px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <h3 className="absolute bottom-3 left-4 right-4 font-heading text-base font-semibold text-white">
                {card.title}
              </h3>
            </div>
            <p className="px-4 py-4 font-sans text-sm leading-relaxed text-on-surface-variant">
              {card.text}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
