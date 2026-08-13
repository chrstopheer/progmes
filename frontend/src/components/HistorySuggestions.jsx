import React, { useEffect } from "react";

const ACTIVITIES_KEY = "prog_ong_activities_v1";
const MAX_SUGGESTIONS = 6;

function getSuggestions(field, query) {
  const q = String(query || "").trim().toLocaleLowerCase("pt-BR");
  if (!q) return [];

  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (!raw) return [];

    const all = JSON.parse(raw) || {};
    const values = [];

    for (const monthData of Object.values(all)) {
      for (const dayEntries of Object.values(monthData || {})) {
        const entries = Array.isArray(dayEntries)
          ? dayEntries
          : [dayEntries];

        for (const entry of entries) {
          const value = String(entry?.[field] || "").trim();
          if (value) values.push(value);
        }
      }
    }

    const unique = [
      ...new Map(
        values.map((value) => [
          value.toLocaleLowerCase("pt-BR"),
          value,
        ]),
      ).values(),
    ];

    const prefix = [];
    const contains = [];

    for (const value of unique) {
      const lower = value.toLocaleLowerCase("pt-BR");

      if (lower === q) continue;

      if (lower.startsWith(q)) {
        prefix.push(value);
      } else if (lower.includes(q)) {
        contains.push(value);
      }
    }

    return [...prefix, ...contains].slice(0, MAX_SUGGESTIONS);
  } catch {
    return [];
  }
}

export default function HistorySuggestions() {
  useEffect(() => {
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

    /*
     * Atualiza o valor real do input de forma compatível
     * com campos controlados pelo React.
     *
     * Isso é importante porque apenas fazer:
     * input.value = suggestion
     *
     * altera a aparência do campo, mas não necessariamente
     * altera o estado interno do React.
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
          /*
           * Impede o input de perder o foco antes de
           * aplicarmos a sugestão.
           */
          event.preventDefault();

          if (!activeInput) return;

          /*
           * Agora o valor é enviado corretamente para
           * o estado controlado pelo React.
           */
          setReactValue(activeInput, suggestion);

          hide();

          activeInput.focus();
        });

        dropdown.appendChild(option);
      });

      document.body.appendChild(dropdown);

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
