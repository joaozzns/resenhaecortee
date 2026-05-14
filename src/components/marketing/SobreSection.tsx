import { Reveal } from "./Reveal";

const ABOUT_VIDEO = "/videos/videojoben.mp4";
const ABOUT_POSTER = "/gallery/corte1.png"; // imagem mostrada antes do vídeo carregar

/**
 * Sobre/História — duas colunas assimétricas, vídeo com moldura dourada
 * deslocada (offset frame): a borda dourada cresce 16px para baixo/direita.
 *
 * O vídeo roda em autoplay/loop/mudo (vibe "vídeo decorativo"). Para mudar,
 * substitua o arquivo em public/videos/sobre.mp4 — H.264, sem som, ~10s.
 */
export function SobreSection() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-heading"
      className="py-24 md:py-32"
    >
      <div className="container-x grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <Reveal as="div" className="lg:col-span-6 order-2 lg:order-1">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Sobre
          </span>
          <h2
            id="sobre-heading"
            className="mt-5 text-4xl md:text-5xl xl:text-6xl"
          >
            Dedicação que virou tradição.
          </h2>
          <div className="mt-7 space-y-5 text-foreground/80 leading-relaxed">
            <p>
              A Barbearia Resenha e Corte nasceu da paixão por transformar
              não apenas a aparência, mas a confiança de cada cliente que
              passa por nossas cadeiras.
            </p>
            <p>
              Aqui em Itabira, nos tornamos mais que uma barbearia — somos um
              ponto de encontro onde tradição, estilo e boas conversas se
              misturam. Nosso ambiente acolhedor e descontraído é o lugar
              perfeito para relaxar, tomar uma cerveja gelada e sair com o
              visual impecável.
            </p>
          </div>
        </Reveal>

        <Reveal
          as="div"
          delay={0.15}
          className="lg:col-span-6 order-1 lg:order-2"
        >
          <div className="relative aspect-[4/5] max-w-[460px] mx-auto lg:mx-0 lg:ml-auto">
            {/* Moldura dourada offset */}
            <div
              aria-hidden
              className="absolute inset-0 translate-x-4 translate-y-4 border border-accent rounded-sm"
            />
            <div className="relative h-full w-full overflow-hidden rounded-sm bg-surface-2">
              {/* Vídeo decorativo: autoplay, loop, mudo, playsInline para iOS.
                  Se o arquivo não existir, o poster aparece como fallback. */}
              <video
                src={ABOUT_VIDEO}
                poster={ABOUT_POSTER}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label="Vídeo do ambiente da barbearia"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Tom sépia sutil para o estilo cinema noir */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(201,163,106,0.06),transparent_30%,rgba(14,14,14,0.25))] mix-blend-multiply pointer-events-none"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
