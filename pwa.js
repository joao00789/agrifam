(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { updateViaCache: "none" })
      .catch((error) => {
        console.error(
          "Não foi possível preparar o AgriFam para uso offline:",
          error,
        );
      });
  });

  const installButton = document.getElementById("pwaInstall");
  const installStatus = document.getElementById("installAppStatus");
  let installPrompt;
  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;
  if (installed && installButton) {
    installButton.disabled = true;
    installButton.textContent = "Já instalado";
    if (installStatus)
      installStatus.textContent = "O AgriFam já está instalado neste aparelho.";
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    if (installButton && !installed) {
      installButton.disabled = false;
      installButton.textContent = "Instalar app";
    }
    if (installStatus)
      installStatus.textContent =
        "Instale o AgriFam para abrir como um aplicativo.";
  });

  installButton?.addEventListener("click", async () => {
    if (installed) return;
    if (!installPrompt) {
      if (installStatus)
        installStatus.textContent =
          "No menu do navegador, escolha “Instalar app” ou “Adicionar à tela inicial”.";
      return;
    }
    const prompt = installPrompt;
    installPrompt = undefined;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted" && installStatus)
        installStatus.textContent =
          "Instalação iniciada. Siga a confirmação do navegador.";
      if (choice.outcome !== "accepted") {
        if (installStatus)
          installStatus.textContent =
            "Tudo bem. Você pode instalar depois pelo menu do navegador.";
      }
    } catch {
      if (installStatus)
        installStatus.textContent =
          "Não foi possível abrir a instalação agora. Tente pelo menu do navegador.";
    }
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = undefined;
    if (installButton) {
      installButton.disabled = true;
      installButton.textContent = "Já instalado";
    }
    if (installStatus)
      installStatus.textContent = "O AgriFam foi instalado neste aparelho.";
  });
})();
