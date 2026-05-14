import { Hero } from "@/components/marketing/Hero";
import { SobreSection } from "@/components/marketing/SobreSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { GallerySection } from "@/components/marketing/GallerySection";
import { TeamSection } from "@/components/marketing/TeamSection";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { siteConfig } from "@/lib/site";

// JSON-LD para SEO local (LocalBusiness + AggregateRating).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BarberShop",
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  telephone: siteConfig.phone,
  image: `${siteConfig.url}/favicon.ico`,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.city,
    addressRegion: siteConfig.address.state,
    addressCountry: "BR",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ],
      opens: "08:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "07:00",
      closes: "16:00",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "180",
  },
  priceRange: "$$",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <SobreSection />
      <ServicesSection />
      <GallerySection />
      <TeamSection />
      <FinalCTA />
    </>
  );
}
