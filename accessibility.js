(() => {
  const trigger = document.getElementById("accessibilityTrigger");
  const widget = document.getElementById("accessibilityWidget");
  const panel = document.getElementById("accessibilityPanel");
  const contrastButton = document.getElementById("accessibilityContrast");
  const motionButton = document.getElementById("accessibilityMotion");
  const spacingButton = document.getElementById("accessibilitySpacing");
  const linksButton = document.getElementById("accessibilityLinks");
  const sizeLabel = document.getElementById("accessibilitySizeLabel");
  const settingsModal = document.getElementById("settingsModal");
  const themeSelect = document.getElementById("settingsTheme");
  const librasToggle = document.getElementById("settingsLibras");
  const librasWidget = document.getElementById("vlibrasWidget");
  if (!trigger || !widget || !panel || !contrastButton) return;

  const readSetting = (key, fallback) => {
    try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
  };
  const saveSetting = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Preferências são opcionais. */ }
  };
  const positionKey = "agrifam-a11y-position";
  const moveWidgetTo = (left, top, persist = true) => {
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - widget.offsetWidth - margin);
    const maxTop = Math.max(margin, window.innerHeight - widget.offsetHeight - margin);
    const nextLeft = Math.max(margin, Math.min(left, maxLeft));
    const nextTop = Math.max(margin, Math.min(top, maxTop));
    widget.style.left = `${nextLeft}px`;
    widget.style.top = `${nextTop}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    if (persist) saveSetting(positionKey, JSON.stringify({ left: nextLeft, top: nextTop }));
  };
  const placePanel = () => {
    const rect = widget.getBoundingClientRect();
    widget.classList.toggle("panel-left", rect.left < 280);
    widget.classList.toggle("panel-below", rect.top < panel.offsetHeight + 24);
  };
  try {
    const savedPosition = JSON.parse(readSetting(positionKey, "null"));
    if (Number.isFinite(savedPosition?.left) && Number.isFinite(savedPosition?.top)) {
      moveWidgetTo(savedPosition.left, savedPosition.top, false);
    }
  } catch { /* Ignora posição local inválida. */ }
  const setSize = (value) => {
    const levels = ["normal", "large", "larger"];
    if (!levels.includes(value)) value = "normal";
    document.documentElement.dataset.a11ySize = value;
    saveSetting("agrifam-a11y-size", value);
    panel.querySelectorAll("[data-a11y-size]").forEach((button) => {
      const selected = button.dataset.a11ySize === value;
      button.setAttribute("aria-pressed", String(selected));
    });
    if (sizeLabel) sizeLabel.textContent = ({ normal: "Texto padrão", large: "Texto aumentado", larger: "Texto ampliado ao máximo" })[value];
  };
  const setContrast = (enabled) => {
    document.documentElement.classList.toggle("a11y-contrast", enabled);
    contrastButton.setAttribute("aria-pressed", String(enabled));
    contrastButton.textContent = enabled ? "Desativar alto contraste" : "Ativar alto contraste";
    saveSetting("agrifam-a11y-contrast", String(enabled));
  };
  const setReducedMotion = (enabled) => {
    document.documentElement.classList.toggle("a11y-reduced-motion", enabled);
    motionButton?.setAttribute("aria-pressed", String(enabled));
    if (motionButton) motionButton.textContent = enabled ? "Animações reduzidas" : "Reduzir animações";
    saveSetting("agrifam-a11y-motion", String(enabled));
  };
  const setTextSpacing = (enabled) => {
    document.documentElement.classList.toggle("a11y-spaced-text", enabled);
    spacingButton?.setAttribute("aria-pressed", String(enabled));
    if (spacingButton) spacingButton.textContent = enabled ? "Espaçamento ampliado" : "Aumentar espaçamento do texto";
    saveSetting("agrifam-a11y-spacing", String(enabled));
  };
  const setLinkHighlight = (enabled) => {
    document.documentElement.classList.toggle("a11y-links-highlight", enabled);
    linksButton?.setAttribute("aria-pressed", String(enabled));
    if (linksButton) linksButton.textContent = enabled ? "Destaque de links ativo" : "Destacar links";
    saveSetting("agrifam-a11y-links", String(enabled));
  };
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = (preference) => {
    const selected = ["light", "dark", "system"].includes(preference) ? preference : "system";
    const resolved = selected === "system" ? (systemTheme.matches ? "dark" : "light") : selected;
    document.documentElement.dataset.theme = resolved;
    if (themeSelect) themeSelect.value = selected;
  };
  applyTheme(readSetting("agrifam-theme", "system"));
  themeSelect?.addEventListener("change", () => {
    const preference = themeSelect.value;
    saveSetting("agrifam-theme", preference);
    applyTheme(preference);
  });
  const updateSystemTheme = () => {
    if (readSetting("agrifam-theme", "system") === "system") applyTheme("system");
  };
  if (systemTheme.addEventListener) systemTheme.addEventListener("change", updateSystemTheme);
  else systemTheme.addListener?.(updateSystemTheme);

  const savedSize = readSetting("agrifam-a11y-size", "normal");
  setSize(savedSize);
  setContrast(readSetting("agrifam-a11y-contrast", "false") === "true");
  setReducedMotion(readSetting("agrifam-a11y-motion", "false") === "true");
  setTextSpacing(readSetting("agrifam-a11y-spacing", "false") === "true");
  setLinkHighlight(readSetting("agrifam-a11y-links", "false") === "true");

  // Eu explico: Carrega o serviço público do VLibras só depois de a pessoa ativá-lo.
  let librasLoadStarted = false;
  const setLibras = (enabled, report = true) => {
    saveSetting("agrifam-vlibras-enabled", String(enabled));
    if (librasToggle) librasToggle.checked = enabled;
    if (!librasWidget) return;
    librasWidget.hidden = !enabled;
    if (!enabled) {
      if (report) {
        const feedback = document.getElementById("settingsFeedback");
        if (feedback) feedback.textContent = "Tradutor de Libras desativado neste aparelho.";
      }
      return;
    }
    if (librasLoadStarted || document.getElementById("vlibrasPluginScript")) return;
    librasLoadStarted = true;
    const feedback = document.getElementById("settingsFeedback");
    if (feedback) feedback.textContent = "Carregando o tradutor VLibras…";
    const script = document.createElement("script");
    script.id = "vlibrasPluginScript";
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onload = () => {
      if (feedback) feedback.textContent = "VLibras ativado. Use o botão flutuante para iniciar a tradução.";
    };
    script.onerror = () => {
      librasLoadStarted = false;
      librasWidget.hidden = true;
      if (librasToggle) librasToggle.checked = false;
      saveSetting("agrifam-vlibras-enabled", "false");
      script.remove();
      if (feedback) feedback.textContent = "Não foi possível carregar o VLibras. Verifique sua conexão e tente novamente.";
    };
    document.body.append(script);
  };
  if (librasToggle) {
    librasToggle.checked = readSetting("agrifam-vlibras-enabled", "true") === "true";
    if (librasToggle.checked) setLibras(true, false);
    librasToggle.addEventListener("change", () => setLibras(librasToggle.checked));
  }

  // Eu explico: Navegação acessível por teclado entre as abas de configurações.
  const settingsTabs = [...(settingsModal?.querySelectorAll("[data-settings-tab]") || [])];
  const activateSettingsTab = (tab) => {
    const selected = tab.dataset.settingsTab;
    settingsTabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    settingsModal?.querySelectorAll("[data-settings-panel]").forEach((content) => {
      content.hidden = content.dataset.settingsPanel !== selected;
    });
    tab.focus();
  };
  settingsTabs.forEach((tab) => {
    tab.addEventListener("click", () => activateSettingsTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const index = settingsTabs.indexOf(tab);
      const next = event.key === "Home" ? 0 : event.key === "End" ? settingsTabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : settingsTabs.length - 1)) % settingsTabs.length;
      activateSettingsTab(settingsTabs[next]);
    });
  });
  document.getElementById("openA11yFromSettings")?.addEventListener("click", () => {
    settingsModal?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("open");
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    placePanel();
    document.getElementById("accessibilityClose")?.focus();
  });

  // Eu explico: Mantém o foco dentro das configurações enquanto o diálogo estiver aberto.
  settingsModal?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...settingsModal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])')]
      .filter((element) => !element.closest("[hidden]"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const closePanel = (returnFocus = true) => {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) trigger.focus();
  };
  trigger.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
    if (open) {
      placePanel();
      panel.querySelector("button")?.focus();
    }
  });

  // Eu explico: Arraste o botão para reposicionar o controle flutuante; a posição fica salva neste aparelho.
  let drag = null;
  let suppressClick = false;
  trigger.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const rect = widget.getBoundingClientRect();
    drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
    trigger.setPointerCapture(event.pointerId);
  });
  trigger.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    event.preventDefault();
    moveWidgetTo(drag.left + dx, drag.top + dy);
    placePanel();
  });
  const finishDrag = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClick = true;
      const status = document.getElementById("accessibilityStatus");
      if (status) status.textContent = "Painel de acessibilidade movido.";
    }
    drag = null;
  };
  trigger.addEventListener("pointerup", finishDrag);
  trigger.addEventListener("pointercancel", finishDrag);
  trigger.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);
  trigger.addEventListener("keydown", (event) => {
    if (!event.altKey || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const rect = widget.getBoundingClientRect();
    const step = 16;
    moveWidgetTo(rect.left + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0), rect.top + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0));
    placePanel();
  });
  window.addEventListener("resize", () => {
    if (widget.style.left) {
      const rect = widget.getBoundingClientRect();
      moveWidgetTo(rect.left, rect.top);
    }
    if (!panel.hidden) placePanel();
  });
  document.getElementById("accessibilityClose")?.addEventListener("click", () => closePanel());
  panel.querySelectorAll("[data-a11y-size]").forEach((button) => {
    button.addEventListener("click", () => setSize(button.dataset.a11ySize));
  });
  contrastButton.addEventListener("click", () => {
    setContrast(contrastButton.getAttribute("aria-pressed") !== "true");
  });
  motionButton?.addEventListener("click", () => {
    setReducedMotion(motionButton.getAttribute("aria-pressed") !== "true");
  });
  spacingButton?.addEventListener("click", () => {
    setTextSpacing(spacingButton.getAttribute("aria-pressed") !== "true");
  });
  linksButton?.addEventListener("click", () => {
    setLinkHighlight(linksButton.getAttribute("aria-pressed") !== "true");
  });
  document.getElementById("accessibilityReset")?.addEventListener("click", () => {
    setSize("normal");
    setContrast(false);
    setReducedMotion(false);
    setTextSpacing(false);
    setLinkHighlight(false);
    const status = document.getElementById("accessibilityStatus");
    if (status) status.textContent = "Preferências restauradas ao padrão.";
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "a") {
      event.preventDefault();
      if (panel.hidden) {
        panel.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        panel.querySelector("button")?.focus();
      } else {
        closePanel();
      }
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!panel.hidden && !widget.contains(event.target)) closePanel(false);
  });
})();
