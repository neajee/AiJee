import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Global scrollbar reset — hide scrollbars across the entire web app
 * (including inside cards and panels) while keeping scroll behavior intact.
 */
function GlobalScrollbarStyleReset() {
  return (
    <style id="expo-scrollbar-reset" dangerouslySetInnerHTML={{ __html: `
      * {
        scrollbar-width: none !important;   /* Firefox */
        -ms-overflow-style: none !important; /* IE 11+ / Edge legacy */
      }
      *::-webkit-scrollbar {
        display: none !important;            /* Chrome / Safari / Edge */
        width: 0 !important;
        height: 0 !important;
      }
      *::-webkit-scrollbar-track,
      *::-webkit-scrollbar-thumb {
        background: transparent !important;
      }
    ` }} />
  );
}

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <GlobalScrollbarStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
