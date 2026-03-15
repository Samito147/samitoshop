/* =========================================================
   ARQUIVO: script.js

   OBJETIVO:
   - Controlar interações principais da página
   - Manter a estrutura limpa, modular e pronta para expansão
   - Trabalhar em conjunto com index.html + style.css

   FUNCIONALIDADES:
   1) FAQ em formato acordeão
   2) Scroll suave para âncoras internas
   3) Destaque automático do item ativo no menu superior
   4) Fechamento inteligente de FAQ ao abrir outro item
   5) Estrutura preparada para futuras melhorias
   6) Integração completa com Meta Pixel
   7) Tracking de scroll depth
   8) Tracking de tempo de tela
   9) Tracking específico por clique nos botões de comprar
   10) Tracking de CTAs internos de rolagem
   11) Tracking de FAQ
   12) Tracking de visualização da seção de ofertas

   OBSERVAÇÃO:
   Este arquivo foi feito para a estrutura HTML entregue.
   Nenhuma biblioteca externa é necessária.
========================================================= */


/* =========================================================
   1) EVENTO PRINCIPAL DE INICIALIZAÇÃO
   ---------------------------------------------------------
   - Aguarda o carregamento completo do DOM
   - Garante que todos os elementos já existam antes
     de conectar eventos e observadores
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initFAQAccordion();
  initSmoothAnchorScroll();
  initActiveNavigation();
  initFacebookPixelTracking();
});


/* =========================================================
   2) FAQ EM ACORDEÃO
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Localizar todos os botões de pergunta do FAQ
   - Abrir/fechar o item clicado
   - Fechar os demais itens ao abrir um novo
   - Atualizar atributo aria-expanded
   - Controlar o hidden da resposta

   ESTRUTURA HTML ESPERADA:
   .faq-item
     .faq-question[aria-expanded]
     .faq-answer[hidden]
========================================================= */
function initFAQAccordion() {
  /* -------------------------------------------
     Seleciona todos os botões do FAQ
  ------------------------------------------- */
  const faqButtons = document.querySelectorAll(".faq-question");

  /* -------------------------------------------
     Se não houver FAQ na página, encerra
     silenciosamente para evitar erro
  ------------------------------------------- */
  if (!faqButtons.length) return;

  /* -------------------------------------------
     Para cada botão, adiciona o evento de clique
  ------------------------------------------- */
  faqButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      /* ---------------------------------------
         Localiza o container .faq-item do botão
      ---------------------------------------- */
      const currentItem = button.closest(".faq-item");

      /* ---------------------------------------
         Localiza a resposta do item atual
      ---------------------------------------- */
      const currentAnswer = currentItem?.querySelector(".faq-answer");

      /* ---------------------------------------
         Segurança: se algo estiver ausente,
         não prossegue
      ---------------------------------------- */
      if (!currentItem || !currentAnswer) return;

      /* ---------------------------------------
         Verifica se o item atual já está aberto
      ---------------------------------------- */
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      /* ---------------------------------------
         Antes de abrir o atual, fecha todos
         os outros itens do FAQ
      ---------------------------------------- */
      closeAllFAQItems(faqButtons);

      /* ---------------------------------------
         Se o item estava fechado, abre.
         Se já estava aberto, o fechamento
         já aconteceu na função acima.
      ---------------------------------------- */
      if (!isExpanded) {
        button.setAttribute("aria-expanded", "true");
        currentAnswer.hidden = false;

        firePixelEvent("trackCustom", "FAQOpen", {
          ...buildPageMetadata(),
          faq_index: index + 1,
          faq_question: normalizeText(button.textContent || "")
        });
      }
    });
  });
}


/* =========================================================
   3) FUNÇÃO AUXILIAR PARA FECHAR TODOS OS ITENS DO FAQ
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Receber a lista de botões do FAQ
   - Marcar todos como fechados
   - Ocultar todas as respostas
========================================================= */
function closeAllFAQItems(faqButtons) {
  faqButtons.forEach((button) => {
    const item = button.closest(".faq-item");
    const answer = item?.querySelector(".faq-answer");

    button.setAttribute("aria-expanded", "false");

    if (answer) {
      answer.hidden = true;
    }
  });
}


/* =========================================================
   4) SCROLL SUAVE PARA ÂNCORAS INTERNAS
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Interceptar cliques em links internos (#...)
   - Aplicar rolagem suave manual
   - Corrigir o deslocamento do topo por causa da topbar
   - Não interferir em links externos

   EXEMPLOS ATENDIDOS:
   href="#comprar"
   href="#faq"
   href="#whatsapp"
========================================================= */
function initSmoothAnchorScroll() {
  /* -------------------------------------------
     Seleciona todos os links com hash
  ------------------------------------------- */
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  if (!anchorLinks.length) return;

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      /* ---------------------------------------
         Ignora hashes inválidos ou vazios
      ---------------------------------------- */
      if (!href || href === "#") return;

      const targetElement = document.querySelector(href);

      /* ---------------------------------------
         Se o alvo não existir, não faz nada
      ---------------------------------------- */
      if (!targetElement) return;

      /* ---------------------------------------
         Tracking de clique em navegação interna
      ---------------------------------------- */
      firePixelEvent("trackCustom", "InternalNavigationClick", {
        ...buildPageMetadata(),
        target_hash: href,
        link_text: normalizeText(link.textContent || ""),
        link_id: link.id || "",
        link_class: typeof link.className === "string" ? link.className : ""
      });

      /* ---------------------------------------
         Impede o comportamento padrão para
         controlar o scroll manualmente
      ---------------------------------------- */
      event.preventDefault();

      /* ---------------------------------------
         Calcula a altura da topbar para que
         a seção não fique escondida atrás dela
      ---------------------------------------- */
      const topbar = document.querySelector(".topbar");
      const topbarHeight = topbar ? topbar.offsetHeight : 0;

      /* ---------------------------------------
         Posição final do alvo na página
      ---------------------------------------- */
      const targetTop =
        targetElement.getBoundingClientRect().top +
        window.pageYOffset -
        topbarHeight -
        12;

      /* ---------------------------------------
         Executa rolagem suave
      ---------------------------------------- */
      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: "smooth"
      });
    });
  });
}


/* =========================================================
   5) MENU ATIVO CONFORME A SEÇÃO VISÍVEL
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Destacar o link da navegação correspondente
     à seção em foco durante o scroll
   - Usar IntersectionObserver para desempenho melhor
   - Funcionar com as âncoras do topo

   MAPEAMENTO ESPERADO:
   .topbar-link[href="#faq"]       -> #faq
   .topbar-link[href="#comprar"]   -> #comprar
   .topbar-link[href="#whatsapp"]  -> #whatsapp
   .topbar-link[href="#formas-pagamento"] -> #formas-pagamento
========================================================= */
function initActiveNavigation() {
  /* -------------------------------------------
     Seleciona apenas links internos da topbar
  ------------------------------------------- */
  const navLinks = document.querySelectorAll('.topbar-link[href^="#"]');

  if (!navLinks.length) return;

  /* -------------------------------------------
     Cria mapa entre hash e link
     Exemplo:
     "#faq" => <a ...>
  ------------------------------------------- */
  const linkMap = new Map();

  navLinks.forEach((link) => {
    const hash = link.getAttribute("href");

    if (hash && hash !== "#") {
      linkMap.set(hash, link);
    }
  });

  /* -------------------------------------------
     Seleciona as seções existentes no DOM com
     base nos hashes encontrados na navegação
  ------------------------------------------- */
  const observedSections = [];

  linkMap.forEach((_, hash) => {
    const section = document.querySelector(hash);

    if (section) {
      observedSections.push(section);
    }
  });

  /* -------------------------------------------
     Se nenhuma seção existir, encerra
  ------------------------------------------- */
  if (!observedSections.length) return;

  /* -------------------------------------------
     Cria observador para detectar seção em foco
  ------------------------------------------- */
  const observer = new IntersectionObserver(
    (entries) => {
      /* ---------------------------------------
         Filtra apenas as entradas visíveis
      ---------------------------------------- */
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);

      /* ---------------------------------------
         Se não houver seção visível, não atualiza
      ---------------------------------------- */
      if (!visibleEntries.length) return;

      /* ---------------------------------------
         Ordena para pegar a seção com maior área
         visível / prioridade natural
      ---------------------------------------- */
      visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      const activeSection = visibleEntries[0].target;
      const activeHash = `#${activeSection.id}`;

      updateActiveNavLink(linkMap, activeHash);
    },
    {
      root: null,
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0.15, 0.25, 0.4, 0.6]
    }
  );

  /* -------------------------------------------
     Observa todas as seções relevantes
  ------------------------------------------- */
  observedSections.forEach((section) => observer.observe(section));

  /* -------------------------------------------
     Estado inicial:
     se a página abrir já no topo ou em hash,
     tenta refletir no menu
  ------------------------------------------- */
  if (window.location.hash && linkMap.has(window.location.hash)) {
    updateActiveNavLink(linkMap, window.location.hash);
  }
}


/* =========================================================
   6) ATUALIZAÇÃO VISUAL DO LINK ATIVO
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Remover classe ativa de todos os links
   - Aplicar classe no link correspondente
   - Aplicar também um atributo auxiliar
     para acessibilidade / depuração
========================================================= */
function updateActiveNavLink(linkMap, activeHash) {
  linkMap.forEach((link) => {
    link.classList.remove("is-active");
    link.removeAttribute("aria-current");
  });

  const activeLink = linkMap.get(activeHash);

  if (activeLink) {
    activeLink.classList.add("is-active");
    activeLink.setAttribute("aria-current", "page");
  }
}


/* =========================================================
   7) INTEGRAÇÃO COMPLETA COM META PIXEL
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Injetar o script oficial do Meta Pixel
   - Inicializar o pixel com o ID informado
   - Disparar eventos essenciais da página
   - Preparar tracking avançado sem interferir
     na dinâmica existente

   EVENTOS BASE:
   - PageView
   - ViewContent
   - EngagedPage (custom)
   - ScrollDepth (custom)
   - TimeOnPage (custom)
   - BuyButtonClick (custom)
   - CTAButtonClick (custom)
   - InitiateCheckout (standard)
========================================================= */
function initFacebookPixelTracking() {
  const PIXEL_ID = "25588035257562551";

  /* -------------------------------------------
     Evita inicialização duplicada do pixel
  ------------------------------------------- */
  if (!window.__META_PIXEL_INITIALIZED__) {
    injectMetaPixelScript();
    initializeMetaPixel(PIXEL_ID);
    window.__META_PIXEL_INITIALIZED__ = true;
  }

  /* -------------------------------------------
     Dispara evento de visualização de conteúdo
     da página, útil para aquecer o funil
  ------------------------------------------- */
  firePixelEvent("track", "ViewContent", buildPageMetadata());

  /* -------------------------------------------
     Inicializa os módulos de tracking fino
  ------------------------------------------- */
  initPixelScrollTracking();
  initPixelTimeOnPageTracking();
  initPixelCTAButtonTracking();
  initPixelQualifiedEngagementTracking();
  initOffersSectionViewTracking();
}


/* =========================================================
   8) INJEÇÃO DO SCRIPT BASE DO META PIXEL
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Inserir o script oficial do Facebook/Meta
   - Criar a função global fbq
   - Não duplicar script caso já exista
========================================================= */
function injectMetaPixelScript() {
  if (window.fbq) return;

  /* eslint-disable */
  !(function(f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
}


/* =========================================================
   9) INICIALIZAÇÃO DO PIXEL
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Registrar o Pixel ID
   - Disparar PageView padrão
========================================================= */
function initializeMetaPixel(pixelId) {
  if (typeof window.fbq !== "function") return;

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}


/* =========================================================
   10) DISPARADOR SEGURO DE EVENTOS DO PIXEL
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Centralizar chamadas do fbq
   - Evitar erro caso o pixel ainda não esteja pronto
========================================================= */
function firePixelEvent(type, eventName, payload = {}) {
  if (typeof window.fbq !== "function") return;

  try {
    window.fbq(type, eventName, payload);
  } catch (error) {
    /* ---------------------------------------
       Segurança silenciosa:
       não quebrar a página por causa do pixel
    ---------------------------------------- */
    console.warn("Meta Pixel event error:", error);
  }
}


/* =========================================================
   11) METADADOS PADRÃO DA PÁGINA
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Coletar informações reutilizáveis
   - Padronizar payloads
========================================================= */
function buildPageMetadata() {
  return {
    content_name: document.title || "Página de Vendas",
    content_category: "Presell",
    content_type: "product_offer",
    content_ids: [window.location.pathname],
    page_path: window.location.pathname,
    page_url: window.location.href,
    page_title: document.title || "",
    referrer: document.referrer || "",
    language: document.documentElement.lang || navigator.language || "pt-BR"
  };
}


/* =========================================================
   12) TRACKING DE SCROLL DEPTH
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Monitorar até onde o usuário rolou
   - Disparar eventos apenas uma vez por faixa
   - Ajudar a identificar visitantes mais quentes

   NÍVEIS:
   - 25%
   - 50%
   - 75%
   - 90%
   - 100%
========================================================= */
function initPixelScrollTracking() {
  const triggeredDepths = new Set();
  const depthMarks = [25, 50, 75, 90, 100];

  function calculateScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );

    if (documentHeight <= viewportHeight) {
      return 100;
    }

    const maxScrollable = documentHeight - viewportHeight;
    const current = Math.min(scrollTop, maxScrollable);
    const depth = (current / maxScrollable) * 100;

    return Math.max(0, Math.min(100, Math.round(depth)));
  }

  function handleScrollDepth() {
    const currentDepth = calculateScrollDepth();

    depthMarks.forEach((mark) => {
      if (currentDepth >= mark && !triggeredDepths.has(mark)) {
        triggeredDepths.add(mark);

        firePixelEvent("trackCustom", "ScrollDepth", {
          ...buildPageMetadata(),
          scroll_depth_percent: mark,
          scroll_depth_label: `${mark}%`
        });
      }
    });
  }

  window.addEventListener("scroll", throttle(handleScrollDepth, 250), { passive: true });

  /* -------------------------------------------
     Checagem inicial para páginas curtas
  ------------------------------------------- */
  handleScrollDepth();
}


/* =========================================================
   13) TRACKING DE TEMPO DE TELA
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Medir permanência na página
   - Disparar checkpoints de tempo
   - Considerar visibilidade da aba para evitar
     inflar métricas igual vendedor inflando urgência

   CHECKPOINTS:
   - 10s
   - 30s
   - 60s
   - 120s
   - 180s
========================================================= */
function initPixelTimeOnPageTracking() {
  const checkpoints = [10, 30, 60, 120, 180];
  const triggeredCheckpoints = new Set();

  let visibleStartTime = Date.now();
  let accumulatedVisibleTimeMs = 0;
  let isPageVisible = document.visibilityState === "visible";

  function getCurrentVisibleSeconds() {
    const liveVisibleMs = isPageVisible ? Date.now() - visibleStartTime : 0;
    return Math.floor((accumulatedVisibleTimeMs + liveVisibleMs) / 1000);
  }

  function evaluateTimeCheckpoints() {
    const visibleSeconds = getCurrentVisibleSeconds();

    checkpoints.forEach((checkpoint) => {
      if (visibleSeconds >= checkpoint && !triggeredCheckpoints.has(checkpoint)) {
        triggeredCheckpoints.add(checkpoint);

        firePixelEvent("trackCustom", "TimeOnPage", {
          ...buildPageMetadata(),
          time_on_page_seconds: checkpoint,
          time_on_page_label: `${checkpoint}s`
        });
      }
    });
  }

  const intervalId = window.setInterval(evaluateTimeCheckpoints, 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && isPageVisible) {
      accumulatedVisibleTimeMs += Date.now() - visibleStartTime;
      isPageVisible = false;
    } else if (document.visibilityState === "visible" && !isPageVisible) {
      visibleStartTime = Date.now();
      isPageVisible = true;
    }
  });

  window.addEventListener("beforeunload", () => {
    if (isPageVisible) {
      accumulatedVisibleTimeMs += Date.now() - visibleStartTime;
    }

    const totalVisibleSeconds = Math.floor(accumulatedVisibleTimeMs / 1000);

    firePixelEvent("trackCustom", "PageExit", {
      ...buildPageMetadata(),
      total_visible_time_seconds: totalVisibleSeconds
    });

    window.clearInterval(intervalId);
  });
}


/* =========================================================
   14) TRACKING DE CLIQUE NOS CTAs E BOTÕES DE COMPRAR
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Localizar elementos com intenção de CTA
   - Diferenciar CTA interno de rolagem e checkout real
   - Priorizar atributos data-* do HTML
   - Disparar eventos customizados detalhados
========================================================= */
function initPixelCTAButtonTracking() {
  const interactiveSelectors = [
    "a",
    "button",
    '[role="button"]',
    "input[type='button']",
    "input[type='submit']"
  ];

  const candidateElements = document.querySelectorAll(interactiveSelectors.join(","));

  if (!candidateElements.length) return;

  const ctaElements = Array.from(candidateElements).filter(isTrackedCTAElement);

  if (!ctaElements.length) return;

  ctaElements.forEach((element, index) => {
    element.addEventListener("click", () => {
      const ctaData = buildCTAEventData(element, index);
      const isCheckoutCTA = ctaData.is_checkout_cta;

      /* ---------------------------------------
         Evento customizado detalhado para todo CTA
      ---------------------------------------- */
      firePixelEvent("trackCustom", isCheckoutCTA ? "BuyButtonClick" : "CTAButtonClick", ctaData);

      /* ---------------------------------------
         Se for clique em oferta real de checkout,
         dispara evento padrão de checkout
      ---------------------------------------- */
      if (isCheckoutCTA) {
        firePixelEvent("track", "InitiateCheckout", {
          content_name: ctaData.plan_name || ctaData.button_text || "Oferta",
          content_category: "Presell CTA",
          content_ids: [ctaData.button_identifier || `cta_${index + 1}`],
          content_type: "product",
          value: ctaData.numeric_price || 0,
          currency: "BRL",
          page_path: ctaData.page_path,
          page_url: ctaData.page_url
        });
      } else {
        /* -------------------------------------
           CTA interno de avanço no funil
        -------------------------------------- */
        firePixelEvent("trackCustom", "ScrollToOfferIntent", {
          ...ctaData,
          target_hash: element.getAttribute("href") || ""
        });
      }
    });
  });
}


/* =========================================================
   15) IDENTIFICAÇÃO DE ELEMENTO RASTREÁVEL COMO CTA
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Verificar data-* primeiro
   - Verificar texto, aria-label, title e value
   - Determinar se o elemento representa CTA
========================================================= */
function isTrackedCTAElement(element) {
  if (!element) return false;

  const hasTrackingDataset =
    Boolean(element.dataset?.cta) ||
    Boolean(element.dataset?.plan) ||
    Boolean(element.dataset?.price);

  if (hasTrackingDataset) {
    return true;
  }

  const textContent = [
    element.textContent || "",
    element.getAttribute("aria-label") || "",
    element.getAttribute("title") || "",
    element.value || ""
  ]
    .join(" ")
    .trim()
    .toLowerCase();

  if (!textContent) return false;

  const ctaKeywords = [
    "comprar",
    "quero comprar",
    "garantir",
    "garanta",
    "adquirir",
    "checkout",
    "finalizar",
    "assinar",
    "obter agora",
    "comprar agora",
    "quero agora",
    "fazer pedido",
    "quero realizar",
    "fortaleça as suas estruturas"
  ];

  return ctaKeywords.some((keyword) => textContent.includes(keyword));
}


/* =========================================================
   16) CONSTRUÇÃO DO PAYLOAD DO CTA
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Coletar dados úteis do clique
   - Identificar botão, preço, posição e contexto
   - Priorizar data-cta, data-plan e data-price
========================================================= */
function buildCTAEventData(element, index) {
  const href = element.getAttribute("href") || "";
  const buttonText = normalizeText(
    element.textContent ||
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.value ||
    `CTA ${index + 1}`
  );

  const section = element.closest("section, article, .offer-card, .price-card, .cta-card, .plan-card, .pricing-card");
  const sectionId = section?.id || "";
  const sectionClass = section?.className || "";
  const surroundingText = extractRelevantSurroundingText(element);

  const datasetCTA = element.dataset?.cta || "";
  const datasetPlan = element.dataset?.plan || "";
  const datasetPrice = element.dataset?.price || "";

  const detectedPriceText = datasetPrice || detectClosestPriceText(element);
  const numericPrice = parseBrazilianPriceToNumber(String(detectedPriceText || ""));
  const ctaType = determineCTAType(element, href, datasetPrice);
  const isCheckoutCTA = ctaType === "checkout";

  return {
    ...buildPageMetadata(),
    button_index: index + 1,
    button_identifier: buildElementIdentifier(element, index),
    button_id: element.id || "",
    button_text: buttonText,
    button_href: href,
    cta_name: datasetCTA || "",
    plan_name: datasetPlan || "",
    cta_type: ctaType,
    is_checkout_cta: isCheckoutCTA,
    is_internal_scroll_cta: ctaType === "scroll",
    section_id: sectionId,
    section_class: typeof sectionClass === "string" ? sectionClass : "",
    detected_price_text: String(detectedPriceText || ""),
    numeric_price: numericPrice,
    surrounding_text_excerpt: surroundingText
  };
}


/* =========================================================
   17) DETERMINAÇÃO DO TIPO DE CTA
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Identificar se o clique é:
     1) scroll interno
     2) checkout real
     3) CTA genérico
========================================================= */
function determineCTAType(element, href, datasetPrice) {
  const hasPrice = Number(parseBrazilianPriceToNumber(String(datasetPrice || ""))) > 0;
  const isHashLink = typeof href === "string" && href.startsWith("#");
  const isExternalLikeLink =
    typeof href === "string" &&
    href.length > 0 &&
    !href.startsWith("#") &&
    !href.startsWith("javascript:");

  if (hasPrice || isExternalLikeLink) {
    return "checkout";
  }

  if (isHashLink) {
    return "scroll";
  }

  return "generic";
}


/* =========================================================
   18) EXTRAI TRECHO DE CONTEXTO AO REDOR DO BOTÃO
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Pegar texto próximo ao CTA
   - Ajudar a identificar plano/oferta/preço
========================================================= */
function extractRelevantSurroundingText(element) {
  const container =
    element.closest(".offer-card, .price-card, .cta-card, .plan-card, .pricing-card, section, article, div") ||
    element.parentElement;

  if (!container) return "";

  const rawText = normalizeText(container.textContent || "");

  if (!rawText) return "";

  return rawText.slice(0, 220);
}


/* =========================================================
   19) DETECÇÃO DO PREÇO MAIS PRÓXIMO
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Tentar encontrar o valor da oferta
   - Priorizar próprio botão
   - Depois, procurar no container mais próximo
   - Suportar formatos BR como:
     R$ 29,90
     29,90
     297
========================================================= */
function detectClosestPriceText(element) {
  const priceRegex = /R\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d{1,3}(?:\.\d{3})*(?:,\d{2})/g;

  /* -------------------------------------------
     1) Tenta no próprio botão
  ------------------------------------------- */
  const selfText = normalizeText(
    [
      element.textContent || "",
      element.getAttribute("aria-label") || "",
      element.getAttribute("title") || "",
      element.value || ""
    ].join(" ")
  );

  const selfMatches = selfText.match(priceRegex);
  if (selfMatches && selfMatches.length) {
    return selfMatches[0];
  }

  /* -------------------------------------------
     2) Tenta no container mais próximo de oferta
  ------------------------------------------- */
  const pricingContainer = element.closest(
    ".offer-card, .price-card, .cta-card, .plan-card, .pricing-card, .product-card, .package-card, section, article, div"
  );

  if (pricingContainer) {
    const containerText = normalizeText(pricingContainer.textContent || "");
    const containerMatches = containerText.match(priceRegex);

    if (containerMatches && containerMatches.length) {
      return chooseMostLikelyPrice(containerMatches);
    }
  }

  return "";
}


/* =========================================================
   20) ESCOLHA DO PREÇO MAIS PROVÁVEL
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Dentre vários valores detectados, retornar
     o mais provável como preço principal
========================================================= */
function chooseMostLikelyPrice(matches) {
  if (!Array.isArray(matches) || !matches.length) return "";

  /* -------------------------------------------
     Ordena por tamanho do texto para priorizar
     padrões como "R$ 29,90" sobre números soltos
  ------------------------------------------- */
  const sortedMatches = [...matches].sort((a, b) => b.length - a.length);

  return sortedMatches[0];
}


/* =========================================================
   21) CONVERSÃO DE PREÇO BR PARA NÚMERO
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Transformar "R$ 29,90" em 29.90
   - Transformar "297" em 297
   - Suportar "197.00" vindo do data-price
========================================================= */
function parseBrazilianPriceToNumber(priceText) {
  if (priceText === null || priceText === undefined) return 0;

  const rawValue = String(priceText).trim();

  if (!rawValue) return 0;

  const hasComma = rawValue.includes(",");
  const hasDot = rawValue.includes(".");

  let normalized = rawValue.replace(/\s/g, "").replace("R$", "");

  if (hasComma) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    normalized = normalized;
  } else {
    normalized = normalized.replace(/[^\d]/g, "");
  }

  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? numeric : 0;
}


/* =========================================================
   22) GERA IDENTIFICADOR DO ELEMENTO
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Criar um identificador estável para o CTA
========================================================= */
function buildElementIdentifier(element, index) {
  const id = element.id ? `id:${element.id}` : "";
  const datasetCTA = element.dataset?.cta ? `cta:${element.dataset.cta}` : "";
  const datasetPlan = element.dataset?.plan ? `plan:${element.dataset.plan}` : "";
  const datasetPrice = element.dataset?.price ? `price:${element.dataset.price}` : "";
  const href = element.getAttribute("href") ? `href:${element.getAttribute("href")}` : "";

  return [id, datasetCTA, datasetPlan, datasetPrice, href, `index:${index + 1}`]
    .filter(Boolean)
    .join(" | ");
}


/* =========================================================
   23) TRACKING DE ENGAJAMENTO QUALIFICADO
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Disparar um evento quando o usuário atingir
     sinais mínimos de interesse real
   - Combinar tempo + scroll para evitar tráfego
     frio fantasiado de lead quente

   REGRA:
   - 30 segundos visíveis OU
   - 50% de scroll
   - Dispara apenas uma vez
========================================================= */
function initPixelQualifiedEngagementTracking() {
  let engagementTriggered = false;
  let visibleSeconds = 0;
  let maxScrollReached = 0;

  function tryTriggerEngagement() {
    if (engagementTriggered) return;

    if (visibleSeconds >= 30 || maxScrollReached >= 50) {
      engagementTriggered = true;

      firePixelEvent("trackCustom", "EngagedPage", {
        ...buildPageMetadata(),
        visible_seconds: visibleSeconds,
        max_scroll_percent: maxScrollReached
      });
    }
  }

  const timeInterval = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      visibleSeconds += 1;
      tryTriggerEngagement();
    }

    if (engagementTriggered) {
      window.clearInterval(timeInterval);
    }
  }, 1000);

  window.addEventListener(
    "scroll",
    throttle(() => {
      maxScrollReached = Math.max(maxScrollReached, getCurrentScrollPercent());
      tryTriggerEngagement();
    }, 200),
    { passive: true }
  );
}


/* =========================================================
   24) TRACKING DE VISUALIZAÇÃO DA SEÇÃO DE OFERTAS
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Detectar quando a seção #comprar entra em foco
   - Disparar apenas uma vez
   - Ajudar a montar audiência de alta intenção
========================================================= */
function initOffersSectionViewTracking() {
  const offersSection = document.querySelector("#comprar");

  if (!offersSection) return;

  let hasTrackedOfferView = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (hasTrackedOfferView) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          hasTrackedOfferView = true;

          firePixelEvent("trackCustom", "OfferSectionView", {
            ...buildPageMetadata(),
            section_id: "comprar",
            intersection_ratio: Number(entry.intersectionRatio.toFixed(2))
          });

          observer.disconnect();
        }
      });
    },
    {
      root: null,
      threshold: [0.35, 0.5, 0.75]
    }
  );

  observer.observe(offersSection);
}


/* =========================================================
   25) UTILITÁRIO: PERCENTUAL DE SCROLL ATUAL
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Retornar quanto da página foi percorrido
========================================================= */
function getCurrentScrollPercent() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  );

  if (documentHeight <= viewportHeight) {
    return 100;
  }

  const maxScrollable = documentHeight - viewportHeight;
  const current = Math.min(scrollTop, maxScrollable);

  return Math.round((current / maxScrollable) * 100);
}


/* =========================================================
   26) UTILITÁRIO: THROTTLE
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Limitar frequência de execução de eventos
     pesados como scroll
========================================================= */
function throttle(callback, delay = 200) {
  let lastCall = 0;
  let timeoutId = null;

  return function throttledFunction(...args) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      lastCall = now;
      callback.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = window.setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        callback.apply(this, args);
      }, remaining);
    }
  };
}


/* =========================================================
   27) UTILITÁRIO: NORMALIZAÇÃO DE TEXTO
   ---------------------------------------------------------
   RESPONSABILIDADE:
   - Limpar espaços duplicados
   - Melhorar legibilidade dos payloads
========================================================= */
function normalizeText(text) {
  if (!text || typeof text !== "string") return "";

  return text.replace(/\s+/g, " ").trim();
}


/* =========================================================
   28) HOOKS FUTUROS
   ---------------------------------------------------------
   Espaço reservado para futuras expansões, como:
   - tracking de CTA
   - lazy enhancements
   - observação de scroll depth
   - integração com pixel
   - animações controladas

   Por enquanto, deixamos apenas a estrutura.
   Código limpo. Sem inventar moda. Sem ritual.
========================================================= */
// function initFutureFeatures() {
//   // Área reservada para melhorias futuras.
// }
