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
  faqButtons.forEach((button) => {
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
   7) HOOKS FUTUROS
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