import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, X } from "lucide-react";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "../lib/storage";
import { toast } from "sonner";

export function SettingsDialog({ open, onOpenChange, onSaved }) {
  const [settings, setSettings] = useState(loadSettings());
  const [newDivision, setNewDivision] = useState("");

  useEffect(() => {
    if (open) setSettings(loadSettings());
  }, [open]);

  const updateHeader = (field, value) =>
    setSettings((s) => ({ ...s, header: { ...s.header, [field]: value } }));

  const addDivision = () => {
    const v = newDivision.trim();
    if (!v) return;
    if (settings.divisions.includes(v)) {
      toast.error("Essa divisão já existe.");
      return;
    }
    setSettings((s) => ({ ...s, divisions: [...s.divisions, v] }));
    setNewDivision("");
  };

  const removeDivision = (d) =>
    setSettings((s) => ({
      ...s,
      divisions: s.divisions.filter((x) => x !== d),
    }));

  const handleSave = () => {
    saveSettings(settings);
    toast.success("Ajustes salvos!");
    onOpenChange(false);
    onSaved && onSaved(settings);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="settings-dialog"
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Ajustes</DialogTitle>
          <DialogDescription>
            Personalize cabeçalho, rodapé e divisões usadas nas atividades.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <section className="space-y-3">
            <h3
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--brand-blue)" }}
            >
              Cabeçalho
            </h3>
            <div className="space-y-2">
              <Label htmlFor="h-title">Título</Label>
              <Input
                id="h-title"
                data-testid="setting-header-title"
                value={settings.header.title}
                onChange={(e) => updateHeader("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-community">Comunidade</Label>
              <Input
                id="h-community"
                data-testid="setting-header-community"
                placeholder="Ex: Comunidade Esperança"
                value={settings.header.community}
                onChange={(e) => updateHeader("community", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-quote">Frase do ano</Label>
              <Textarea
                id="h-quote"
                data-testid="setting-header-quote"
                rows={2}
                value={settings.header.quote}
                onChange={(e) => updateHeader("quote", e.target.value)}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--brand-blue)" }}
            >
              Rodapé
            </h3>
            <Textarea
              id="footer"
              data-testid="setting-footer"
              rows={2}
              value={settings.footer}
              onChange={(e) =>
                setSettings((s) => ({ ...s, footer: e.target.value }))
              }
            />
          </section>

          <section className="space-y-3">
            <h3
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--brand-blue)" }}
            >
              Divisões
            </h3>
            <div className="flex flex-wrap gap-2">
              {settings.divisions.map((d) => (
                <Badge
                  key={d}
                  data-testid={`division-chip-${d}`}
                  variant="secondary"
                  className="pl-3 pr-1 py-1 gap-1 text-sm"
                  style={{
                    background: "var(--brand-blue-soft)",
                    color: "var(--brand-blue)",
                  }}
                >
                  {d}
                  <button
                    type="button"
                    data-testid={`remove-division-${d}`}
                    onClick={() => removeDivision(d)}
                    className="ml-1 rounded-full hover:bg-white/60 p-0.5"
                    aria-label={`Remover ${d}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
              {settings.divisions.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  Nenhuma divisão cadastrada.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                data-testid="new-division-input"
                placeholder="Ex: DE, DFJ, DMJ…"
                value={newDivision}
                onChange={(e) => setNewDivision(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDivision())}
              />
              <Button
                type="button"
                data-testid="add-division-btn"
                onClick={addDivision}
                style={{ background: "var(--brand-blue)", color: "white" }}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            data-testid="settings-reset-btn"
            onClick={handleReset}
          >
            Restaurar padrão
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              data-testid="settings-cancel-btn"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              data-testid="settings-save-btn"
              onClick={handleSave}
              style={{ background: "var(--brand-red)", color: "white" }}
            >
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
