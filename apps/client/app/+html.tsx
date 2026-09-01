import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Global scrollbar reset — hide scrollbars across the entire web app
 * (including inside cards and panels) while keeping scroll behavior intact.
 */
function GlobalScrollbarStyleReset() {
  return (
      <style id="expo-scrollbar-reset" dangerouslySetInnerHTML={{ __html: `
      :root {
        --aijee-background: #ffffff;
        --aijee-text: #1c1c1c;
        --aijee-accent: #2563eb;
        --aijee-ui-font-size: 14px;
        --aijee-code-font-size: 13px;
      }
      body { background: var(--aijee-background); color: var(--aijee-text); }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
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

function WebStartupScreen() {
  return (
    <>
      <style id="aijee-web-startup-style" dangerouslySetInnerHTML={{ __html: `
        #aijee-web-startup {
          position: fixed; inset: 0; z-index: 2147483647;
          display: grid; place-items: center; background: #fff;
          transition: opacity 180ms ease; opacity: 1;
        }
        #aijee-web-startup.is-ready { opacity: 0; pointer-events: none; }
        .aijee-morph { position: relative; width: 128px; height: 128px; }
        .aijee-morph span {
          position: absolute; top: calc(50% - 8px); left: calc(50% - 8px);
          width: 16px; height: 16px; background: #000;
          animation: aijee-morph 2s infinite ease-in-out;
        }
        .aijee-morph span:nth-child(2) { animation-delay: -1.5s; }
        .aijee-morph span:nth-child(3) { animation-delay: -1s; }
        .aijee-morph span:nth-child(4) { animation-delay: -.5s; }
        @keyframes aijee-morph {
          0%, 100% { transform: translate(0, 0) scale(1); border-radius: 0; }
          25% { transform: translate(20px, -20px) scale(1.2) rotate(90deg); border-radius: 50%; }
          50% { transform: translate(0, 40px) scale(.8) rotate(180deg); border-radius: 25%; }
          75% { transform: translate(-20px, 20px) scale(1.1) rotate(270deg); border-radius: 75%; }
        }
        @media (prefers-color-scheme: dark) {
          #aijee-web-startup { background: #161616; }
          .aijee-morph span { background: #fff; }
        }
      ` }} />
      <div id="aijee-web-startup" role="status" aria-label="Loading AiJee">
        <div className="aijee-morph" aria-hidden="true"><span /><span /><span /><span /></div>
      </div>
    </>
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
      <body>
        <WebStartupScreen />
        {children}
      </body>
    </html>
  );
}
