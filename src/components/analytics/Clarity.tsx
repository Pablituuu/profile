"use client";

import Script from "next/script";

export default function Clarity() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  console.log("App Version: 0.1.0");

  if (!projectId) {
    console.warn(
      "Clarity Analytics: NEXT_PUBLIC_CLARITY_PROJECT_ID not found.",
    );
    return null;
  }

  console.log("Clarity Analytics: ID detected successfully.");

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${projectId}");
        `,
      }}
    />
  );
}
