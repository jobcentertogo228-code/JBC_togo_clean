"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaInstallPrompt() {
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isAppleMobile, setIsAppleMobile] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const checkInstalled = () => {
      const appleStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
      setInstalled(standaloneQuery.matches || appleStandalone === true);
    };
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    setIsAppleMobile(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    checkInstalled();
    standaloneQuery.addEventListener("change", checkInstalled);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    setReady(true);

    return () => {
      standaloneQuery.removeEventListener("change", checkInstalled);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!ready || installed || dismissed) return null;

  async function installApp() {
    if (!installEvent) {
      setShowInstructions((visible) => !visible);
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  }

  return (
    <aside className="pwa-install" aria-label="Installation de Job Center">
      <div className="pwa-install-copy">
        <strong>Installer Job Center</strong>
        <span>Retrouvez la plateforme depuis votre écran d’accueil.</span>
        {showInstructions && (
          <span id="pwa-install-instructions" role="status">
            {isAppleMobile
              ? "Dans Safari, touchez Partager, puis « Sur l’écran d’accueil »."
              : "Ouvrez le menu de votre navigateur, puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil »."}
          </span>
        )}
      </div>
      <button
        className="button pwa-install-button"
        type="button"
        onClick={installApp}
        aria-expanded={showInstructions}
        aria-describedby={showInstructions ? "pwa-install-instructions" : undefined}
      >
        Installer
      </button>
      <button
        className="pwa-dismiss"
        type="button"
        aria-label="Masquer l’invitation à installer Job Center"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </aside>
  );
}
