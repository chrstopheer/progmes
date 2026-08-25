import React, { useEffect } from "react";
import { deleteActivitySuggestion, listActivitySuggestions } from "../lib/storage";

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
        const option = document.createElement("div");
        const selectButton = document.createElement("button");
        const label = document.createElement("span");
        const deleteButton = document.createElement("button");

        selectButton.type = "button";
        selectButton.setAttribute("aria-label", `Usar sugestão ${suggestion}`);
        label.textContent = suggestion;
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `Excluir sugestão ${suggestion}`);
        deleteButton.setAttribute("title", "Excluir sugestão do histórico");
        deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M8 6V4h8v2m-9 0 1 15h8l1-15M10 11v6m4-6v6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';

        option.setAttribute(
          "data-progmes-suggestion",
          "true",
        );

        Object.assign(option.style, {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          width: "100%",
          border: "0",
          background: "white",
          textAlign: "left",
          padding: "10px 8px 10px 12px",
          fontSize: "14px",
          lineHeight: "1.3",
          cursor: "pointer",
          borderRadius: "7px",
        });

        Object.assign(selectButton.style, {
          minWidth: "0",
          flex: "1 1 auto",
          border: "0",
          padding: "0",
          color: "inherit",
          background: "transparent",
          textAlign: "left",
          font: "inherit",
          lineHeight: "inherit",
          cursor: "pointer",
        });

        Object.assign(label.style, {
          display: "block",
          minWidth: "0",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        });

        Object.assign(deleteButton.style, {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
          width: "32px",
          height: "32px",
          padding: "6px",
          border: "0",
          borderRadius: "6px",
          color: "var(--muted-foreground, #64748b)",
          background: "transparent",
          cursor: "pointer",
        });

        const deleteIcon = deleteButton.querySelector("svg");
        deleteIcon.style.width = "18px";
        deleteIcon.style.height = "18px";

        option.addEventListener("mouseenter", () => {
          option.style.background =
            "var(--brand-blue-soft, #eef5ff)";
        });

        option.addEventListener("mouseleave", () => {
          option.style.background = "white";
        });

        deleteButton.addEventListener("mouseenter", () => {
          deleteButton.style.color = "var(--destructive, #dc2626)";
          deleteButton.style.background = "var(--brand-blue-soft, #eef5ff)";
        });

        deleteButton.addEventListener("mouseleave", () => {
          deleteButton.style.color = "var(--muted-foreground, #64748b)";
          deleteButton.style.background = "transparent";
        });

        deleteButton.addEventListener("mousedown", async (event) => {
          event.preventDefault();
          event.stopPropagation();

          const input = activeInput;
          try {
            await deleteActivitySuggestion(getField(input), suggestion);
            suggestionCache = await listActivitySuggestions();
            if (input && input.isConnected) show(input);
            else hide();
          } catch (error) {
            console.error("Não foi possível excluir a sugestão do histórico.", error);
          }
        });

        selectButton.addEventListener("mousedown", (event) => {
          event.preventDefault();

          const input = activeInput;
          if (!input) return;

          setReactValue(input, suggestion);

          hide();

          input.focus();
        });

        selectButton.append(label);
        option.append(selectButton, deleteButton);
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
