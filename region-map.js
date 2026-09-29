/*
 * Mapa público da região do AgriFam.
 * Os marcadores mostram o centro das cidades, nunca a localização de uma casa
 * ou propriedade. Quando houver coordenadas de produtores com consentimento,
 * elas poderão ser adicionadas por uma camada separada e aproximada.
 */
(() => {
  const mapElement = document.getElementById("regionMap");
  if (!mapElement || !window.L) return;

  const places = {
    jardim: {
      name: "Jardim do Mulato",
      coords: [-6.09889, -42.63],
      zoom: 11,
      note: "Ponto de referência municipal",
    },
    angical: {
      name: "Angical do Piauí",
      coords: [-6.08583, -42.73917],
      zoom: 11,
      note: "Município vizinho",
    },
    regeneracao: {
      name: "Regeneração",
      coords: [-6.23778, -42.68833],
      zoom: 10,
      note: "Município da região",
    },
    "santo-antonio": {
      name: "Santo Antônio dos Milagres",
      coords: [-6.04694, -42.70972],
      zoom: 11,
      note: "Município vizinho",
    },
    "sao-goncalo": {
      name: "São Gonçalo do Piauí",
      coords: [-5.99333, -42.70278],
      zoom: 11,
      note: "Município vizinho",
    },
    "hugo-napoleao": {
      name: "Hugo Napoleão",
      coords: [-5.98972, -42.55611],
      zoom: 11,
      note: "Município vizinho",
    },
  };

  const map = L.map(mapElement, {
    scrollWheelZoom: false,
    zoomControl: false,
    minZoom: 8,
    maxZoom: 16,
  }).setView(places.jardim.coords, 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  const markerIcon = L.divIcon({
    className: "",
    html: '<span class="agrifam-map-marker"><span aria-hidden="true">⌖</span></span>',
    iconSize: [34, 38],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });

  Object.entries(places).forEach(([id, place]) => {
    const marker = L.marker(place.coords, { icon: markerIcon }).addTo(map);
    marker.bindPopup(`<strong>${place.name}</strong><br>${place.note}`);
    if (id === "jardim") marker.openPopup();
  });

  document.querySelectorAll("[data-map-place]").forEach((button) => {
    button.addEventListener("click", () => {
      const place = places[button.dataset.mapPlace];
      if (!place) return;
      document.querySelectorAll("[data-map-place]").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      map.flyTo(place.coords, place.zoom, { duration: 0.8 });
    });
  });

  // Leaflet mede o mapa antes da seção aparecer em alguns celulares; recalcular
  // ao rolar até ela evita áreas cinzas ou controles fora do lugar.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) map.invalidateSize();
    });
    observer.observe(mapElement);
  } else {
    window.addEventListener("load", () => map.invalidateSize(), { once: true });
  }
})();
