import React, { useEffect } from "react";
import { listActivitySuggestions } from "../lib/storage";

const MAX_SUGGESTIONS = 6;
let suggestionCache = { activities: [], places: [] };

function getSuggestions(field, query) {
  const q = String(query || "").trim().toLocaleLowerCase("pt-BR");
  if (!q) return [];
  const values = suggestionCache[field === "activity" ? "activities" : "places"] || [];
  const prefix = []; const contains = [];
  values.forEach((value) => {
    const lower = value.toLocaleLowerCase("pt-BR");
    if (lower === q) return;
    if (lower.startsWith(q)) prefix.push(value); else if (lower.includes(q)) contains.push(value);
  });
  return [...prefix, ...contains].slice(0, MAX_SUGGESTIONS);
}

export default function HistorySuggestions() {
  useEffect(() => {
    const refreshSuggestions = () => listActivitySuggestions().then((next) => { suggestionCache = next; });
    refreshSuggestions();
    window.addEventListener("prog-ong:data-updated", refreshSuggestions);
    let dropdown = null;
    let activeInput = null;

    const isTarget = (element) =>
      element instanceof HTMLElement &&
      (/^activity-\d+$/.test(element.id) ||
        /^place-\d+$/.test(element.id));

    const getField = (element) =>
      element.id.startsWith("activity-") ? "activity" : "place";

    const hide = () => {
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      }

      activeInput = null;
    };

    const position = () => {
      if (!dropdown || !activeInput) return;

      const rect = activeInput.getBoundingClientRect();

      dropdown.style.left = `${rect.left}px`;
      dropdown.style.top = `${rect.bottom + 4}px`;
      dropdown.style.width = `${rect.width}px`;
    };

    const scrollInputIntoView = (input) => {
      if (!input || !input.isConnected) return;

      // Aguarda o teclado virtual terminar de abrir antes de calcular
      // a área realmente visível do dispositivo.
      window.setTimeout(() => {
        if (!input.isConnected) return;

        const viewport = window.visualViewport;
        const visibleBottom = viewport
          ? viewport.offsetTop + viewport.height
          : window.innerHeight;
        const rect = input.getBoundingClientRect();
        const suggestionHeight = 56;
        const margin = 12;

        // Se o campo ou a área reservada para a sugestão ficar atrás
        // do teclado, rola a página apenas o necessário para exibi-los.
        const requiredBottom = rect.bottom + suggestionHeight + margin;

        if (requiredBottom > visibleBottom) {
          const amount = requiredBottom - visibleBottom;
          window.scrollBy({
            top: amount,
            behavior: "smooth",
          });
        }
      }, 120);
    };

    /*
     * Atualiza o valor real do input de forma compatível
     * com campos controlados pelo React.
     */
    const setReactValue = (input, value) => {
      const prototype =
        input instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;

      const setter = Object.getOwnPropertyDescriptor(
        prototype,
        "value",
      )?.set;

      if (setter) {
        setter.call(input, value);
      } else {
        input.value = value;
      }

      input.dispatchEvent(
        new Event("input", {
          bubbles: true,
        }),
      );

      input.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );
    };

    const show = (input) => {
      if (!isTarget(input)) return;

      const suggestions = getSuggestions(
        getField(input),
        input.value,
      );

      hide();

      if (!suggestions.length) return;

      activeInput = input;

      dropdown = document.createElement("div");

      dropdown.setAttribute(
        "data-progmes-suggestions",
        "true",
      );

      Object.assign(dropdown.style, {
        position: "fixed",
        zIndex: "9999",
        background: "white",
        border: "1px solid var(--hairline, #ddd)",
        borderRadius: "10px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        overflow: "hidden",
        padding: "4px",
      });

      suggestions.forEach((suggestion) => {
        const option = document.createElement("button");

        option.type = "button";
        option.textContent = suggestion;

        option.setAttribute(
          "data-progmes-suggestion",
          "true",
        );

        Object.assign(option.style, {
          display: "block",
          width: "100%",
          border: "0",
          background: "white",
          textAlign: "left",
          padding: "10px 12px",
          fontSize: "14px",
          lineHeight: "1.3",
          cursor: "pointer",
          borderRadius: "7px",
        });

        option.addEventListener("mouseenter", () => {
          option.style.background =
            "var(--brand-blue-soft, #eef5ff)";
        });

        option.addEventListener("mouseleave", () => {
          option.style.background = "white";
        });

        option.addEventListener("mousedown", (event) => {
          event.preventDefault();

          if (!activeInput) return;

          setReactValue(activeInput, suggestion);

          hide();

          activeInput.focus();
        });

        dropdown.appendChild(option);
      });

      document.body.appendChild(dropdown);

      scrollInputIntoView(input);
      position();
    };

    const onInput = (event) => {
      if (isTarget(event.target)) {
        show(event.target);
      }
    };

    const onFocus = (event) => {
      if (isTarget(event.target)) {
        show(event.target);
      }
    };

    const onClick = (event) => {
      if (
        dropdown &&
        !dropdown.contains(event.target) &&
        event.target !== activeInput
      ) {
        hide();
      }
    };

    const onScroll = () => {
      if (dropdown) {
        position();
      }
    };

    document.addEventListener("input", onInput);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("mousedown", onClick);

    window.addEventListener(
      "scroll",
      onScroll,
      true,
    );

    window.addEventListener(
      "resize",
      onScroll,
    );

    return () => {
      window.removeEventListener("prog-ong:data-updated", refreshSuggestions);
      document.removeEventListener(
        "input",
        onInput,
      );

      document.removeEventListener(
        "focusin",
        onFocus,
      );

      document.removeEventListener(
        "mousedown",
        onClick,
      );

      window.removeEventListener(
        "scroll",
        onScroll,
        true,
      );

      window.removeEventListener(
        "resize",
        onScroll,
      );

      hide();
    };
  }, []);

  return null;
}
