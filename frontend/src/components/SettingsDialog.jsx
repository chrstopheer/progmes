import React, { useState, useEffect, useRef } from "react";
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
import { MONTHS_PT } from "../lib/date-utils";
import { toast } from "sonner";

const COMMUNITY_DEFAULT = "Comunidade Exemplo";
const SETTINGS_HISTORY_STATE = "progmes-settings-dialog";

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

const textInputProps = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "sentences",
  spellCheck: false,
};

export function SettingsDialog({ open, onOpenChange, onSaved, selectedYear, selectedMonth }) {
  const [settings, setSettings] = useState(() => settingsWithCommunityDefault(loadSettings()));
  const historyEntryAdded = useRef(false);
  const handlingPopState = useRef(false);
  const generatedTitle = `Programação do Mês de ${MONTHS_PT[selectedMonth ?? 0]} de ${selectedYear}`;

  useEffect(() => {
    if (!open) return;
    window.history.pushState(
      { ...(window.history.state || {}), settingsDialog: SETTINGS_HISTORY_STATE },
      "",
      window.location.href,
    );
    historyEntryAdded.current = true;
    const handlePopState = () => {
      handlingPopState.current = true;
      historyEntryAdded.current = false;
      onOpenChange(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) setSettings(settingsWithCommunityDefault(loadSettings()));
  }, [open]);

  const closeDialog = () => {
    if (handlingPopState.current) {
      handlingPopState.current = false;
      onOpenChange(false);
      return;
    }
    if (historyEntryAdded.current && window.history.state?.settingsDialog === SETTINGS_HISTORY_STATE) {
      historyEntryAdded.current = false;
      window.history.back();
      return;
    }
    onOpenChange(false);
  };

  const handleDialogOpenChange = (nextOpen) => {
    if (nextOpen) onOpenChange(true);
    else closeDialog();
  };

  const updateHeader = (field, value) =>
    setSettings((s) => ({ ...s, header: { ...s.header, [field]: value } }));

  const handleSave = () => {
    const nextSettings = {
      ...settings,
      header: {
        ...settings.header,
        title: generatedTitle,
      },
    };
    saveSettings(nextSettings);
    toast.success("Ajustes salvos!");
    closeDialog();
    onSaved && onSaved(nextSettings);
  };

  const handleReset = () => {
    setSettings({
      ...DEFAULT_SETTINGS,
      header: {
        ...DEFAULT_SETTINGS.header,
        title: generatedTitle,
        community: COMMUNITY_DEFAULT,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent data-testid="settings-dialog" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Ajustes</DialogTitle>
          <DialogDescription>Personalize cabeçalho e rodapé usados na programação.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--brand-blue)" }}>Cabeçalho</h3>
            <div className="space-y-2">
              <Label htmlFor="h-title">Título</Label>
              <Input
                id="h-title"
                data-testid="setting-header-title"
                value={generatedTitle}
                readOnly
                disabled
                {...textInputProps}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-community">Comunidade</Label>
              <Input id="h-community" data-testid="setting-header-community" value={settings.header.community} onChange={(e) => updateHeader("community", e.target.value)} {...textInputProps} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-quote">Lema {selectedYear}</Label>
              <Textarea
                id="h-quote"
                data-testid="setting-header-quote"
                rows={2}
                value={settings.header.quote}
                readOnly
                disabled
                {...textInputProps}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--brand-blue)" }}>Rodapé</h3>
            <Textarea id="footer" data-testid="setting-footer" rows={2} value={settings.footer} onChange={(e) => setSettings((s) => ({ ...s, footer: e.target.value }))} {...textInputProps} />
          </section>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" data-testid="settings-reset-btn" onClick={handleReset} style={{ background: "var(--brand-yellow)", color: "var(--ink)" }}>Restaurar padrão</Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" data-testid="settings-cancel-btn" onClick={closeDialog}>Cancelar</Button>
            <Button type="button" data-testid="settings-save-btn" onClick={handleSave} style={{ background: "var(--brand-red)", color: "white" }}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
