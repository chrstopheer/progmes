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
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "../lib/storage";
import { toast } from "sonner";

const COMMUNITY_DEFAULT = "Comunidade Exemplo";

function settingsWithCommunityDefault(settings) {
  if (settings?.header?.community) return settings;
  return {
    ...settings,
    header: {
      ...settings.header,
      community: COMMUNITY_DEFAULT,
    },
  };
}

export function SettingsDialog({ open, onOpenChange, onSaved, selectedYear }) {
  const [settings, setSettings] = useState(() =>
    settingsWithCommunityDefault(loadSettings()),
  );

  useEffect(() => {
    if (open) setSettings(settingsWithCommunityDefault(loadSettings()));
  }, [open]);

  const updateHeader = (field, value) =>
    setSettings((s) => ({ ...s, header: { ...s.header, [field]: value } }));

  const handleSave = () => {
    saveSettings(settings);
    toast.success("Ajustes salvos!");
    onOpenChange(false);
    onSaved && onSaved(settings);
  };

  const handleReset = () => {
    setSettings({
      ...DEFAULT_SETTINGS,
      header: {
        ...DEFAULT_SETTINGS.header,
        community: COMMUNITY_DEFAULT,
      },
    });
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
            Personalize cabeçalho e rodapé usados na programação.
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
                value={settings.header.community}
                onChange={(e) => updateHeader("community", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-quote">Lema {selectedYear}</Label>
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
