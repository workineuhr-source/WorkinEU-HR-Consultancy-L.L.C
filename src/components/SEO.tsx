import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  url?: string;
}

export default function SEO({
  title,
  description = "Work in Europe - Premier HR Recruitment Agency for EU Jobs. Connect with top employers in Croatia, Romania, Slovenia, and more.",
  keywords = "Jobs in Europe for Nepalese, Work in Europe, EU jobs for Asians, Work in Slovenia, Work in Croatia, Work in Romania, HR recruitment agency",
  url = window.location.href,
}: SEOProps) {
  const siteTitle = `${title} | WorkinEU HR`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />

      {/* Robots & Canonical */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
