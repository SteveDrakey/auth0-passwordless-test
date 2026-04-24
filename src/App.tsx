import { useEffect, useState } from "react";
import ServiceSelector, { type Service } from "./components/ServiceSelector";
import StreetlightFlow from "./components/StreetlightFlow";
import StreetlightMagicFlow from "./components/StreetlightMagicFlow";
import BinOrderInlineFlow from "./components/BinOrderInlineFlow";
import BinOrderUniversalFlow from "./components/BinOrderUniversalFlow";
import StreetlightUniversalFlow from "./components/StreetlightUniversalFlow";

type View = "select" | Service;

export default function App() {
  const [view, setView] = useState<View>("select");

  // Parse URL hash for callback results
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#mfa-complete") || hash.startsWith("#mfa-error")) {
      const returnFlow = sessionStorage.getItem("mfa-return-flow");
      sessionStorage.removeItem("mfa-return-flow");
      setView(returnFlow === "streetlight-universal" ? "streetlight-universal" : "bin-universal");
    } else if (hash.startsWith("#magic-complete") || hash.startsWith("#magic-error")) {
      setView("streetlight-magic");
    }
  }, []);

  const goHome = () => setView("select");

  return (
    <div className="min-h-screen bg-[#dee2e6]">
      {/* Council-style header bar */}
      <div className="bg-council">
        <div className={`${view === "select" ? "max-w-5xl" : "max-w-lg"} mx-auto px-5 py-4 flex items-center justify-between transition-all`}>
          <div className="flex items-center gap-3">
            <div>
              <div className="text-white font-bold text-base tracking-wide">Leeds</div>
              <div className="text-white/80 text-xs">City Council</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-link text-sm font-medium border-b-2 border-accent text-white">Services</span>
            <span className="text-white/80 text-sm">Apply, report or pay</span>
          </div>
        </div>
      </div>

      {/* Amber accent strip */}
      <div className="h-1 bg-accent"></div>

      <div className={`${view === "select" ? "max-w-5xl" : "max-w-lg"} mx-auto px-5 py-8 transition-all`}>
        {view === "select" && (
          <>
            <ServiceSelector onSelect={setView} />
            <div className="text-center mt-6">
              <span className="text-gray-400 text-xs font-mono">{__BUILD_HASH__}</span>
            </div>
          </>
        )}
        {view === "streetlight" && <StreetlightFlow onBack={goHome} />}
        {view === "streetlight-magic" && <StreetlightMagicFlow onBack={goHome} />}
        {view === "bin-inline" && <BinOrderInlineFlow onBack={goHome} />}
        {view === "bin-universal" && <BinOrderUniversalFlow onBack={goHome} />}
        {view === "streetlight-universal" && <StreetlightUniversalFlow onBack={goHome} />}
      </div>
    </div>
  );
}
