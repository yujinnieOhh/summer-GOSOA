import Script from "next/script";

/**
 * Microsoft Clarity (session recordings + heatmaps).
 *
 * Loads only when NEXT_PUBLIC_CLARITY_PROJECT_ID is set, so the app stays
 * clean until you paste in the project ID from https://clarity.microsoft.com.
 * The env var is inlined at build time — set it locally in `.env.local` and
 * in the Vercel project's Environment Variables for production.
 */
export default function ClarityAnalytics() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!projectId) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  );
}
