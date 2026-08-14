import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { AppHeader } from "../components/AppHeader";
import { ArrowLeft, Trash2, Save, Clock, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  loadMonth,
  loadSettings,
  saveActivities,
  deleteActivity,
} from "../lib/storage";
import {
  MONTHS_PT,
  weekdayFullOfDay,
  daysInMonth,
} from "../lib/date-utils";

const EMPTY_ENTRY = { division: "", activity: "", place: "", time: "" };
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function EntryCard({ index, total, entry, divisions, onChange, onRemove, cardRef }) {
  const setField = (field, value) => onChange({ ...entry, [field]: value });
  const [hh, mm] = (entry.time || "").split(":");

  return (
    <div
      ref={cardRef}
      className="rounded-xl border p-4 sm:p-5 space-y-4 relative bg-white"
      style={{ borderColor: "var(--hairline)" }}
      data-testid={`activity-entry-${index}`}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] uppercase tracking-widest font-semibold"
          style={{ color: "var(--brand-blue)" }}
        >
          Atividade {index + 1} de {total}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            data-testid={`remove-entry-${index}`}
            className="rounded-full p-2.5 -m-2 hover:bg-red-50 transition min-w-11 min-h-11 flex items-center justify-center"
            aria-label={`Remover atividade ${index + 1}`}
          >
            <X className="h-5 w-5" style={{ color: "var(--brand-red)" }} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`division-${index}`}>Divisão</Label>
        <Select
          value={entry.division || ""}
          onValueChange={(v) => setField("division", v)}
        >
          <SelectTrigger id={`division-${index}`} data-testid={`division-select-${index}`}>
            <SelectValue placeholder="Selecione uma divisão" />
          </SelectTrigger>
          <SelectContent>
            {divisions.map((div) => (
              <SelectItem
                key={div}
                value={div}
                data-testid={`division-option-${index}-${div}`}
              >
                {div}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`activity-${index}`}>Atividade</Label>
        <Textarea
          id={`activity-${index}`}
          data-testid={`activity-input-${index}`}
          rows={2}
          value={entry.activity}
          onChange={(e) => setField("activity", e.target.value)}
          placeholder="Ex: Daimoku da Comunidade Putim - Vitória Total"
        />
      </div>

      <div className="grid sm:grid-cols-[1fr_180px] gap-4">
        <div className="space-y-2">
          <Label htmlFor={`place-${index}`}>
            <MapPin className="inline h-3.5 w-3.5 mr-1" /> Local
          </Label>
          <Input
            id={`place-${index}`}
            data-testid={`place-input-${index}`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={entry.place}
            onChange={(e) => setField("place", e.target.value)}
            placeholder="Ex: Res. Sra. Ana"
          />
        </div>
        <div className="space-y-2">
          <Label>
            <Clock className="inline h-3.5 w-3.5 mr-1" /> Horário
          </Label>
          <div
            className="flex items-center gap-2"
            data-testid={`time-picker-${index}`}
          >
            <Select
              value={hh || ""}
              onValueChange={(h) =>
                setField("time", `${h}:${mm || "00"}`)
              }
            >
              <SelectTrigger
                className="flex-1"
                data-testid={`time-hour-select-${index}`}
              >
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span
              className="text-lg font-semibold"
              style={{ color: "var(--ink-soft)" }}
            >
              :
            </span>
            <Select
              value={mm || ""}
              onValueChange={(mn) =>
                setField("time", `${hh || "00"}:${mn}`)
              }
            >
              <SelectTrigger
                className="flex-1"
                data-testid={`time-minute-select-${index}`}
              >
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {MINUTES.map((mn) => (
                  <SelectItem key={mn} value={mn}>
                    {mn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityForm() {
  const { year, month, day } = useParams();
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  const navigate = useNavigate();

  const [settings] = useState(loadSettings());
  const [entries, setEntries] = useState([{ ...EMPTY_ENTRY }]);
  const [existing, setExisting] = useState(false);
  const entryRefs = useRef([]);
  const shouldScrollToNewEntry = useRef(false);

  useEffect(() => {
    const monthData = loadMonth(y, m);
    const dayData = monthData[d];
    if (Array.isArray(dayData) && dayData.length > 0) {
      setEntries(
        dayData.map((a) => ({
          division: a.division || "",
          activity: a.activity || "",
          place: a.place || "",
          time: a.time || "",
        })),
      );
      setExisting(true);
    } else {
      setEntries([{ ...EMPTY_ENTRY }]);
      setExisting(false);
    }
  }, [y, m, d]);

  useEffect(() => {
    if (!shouldScrollToNewEntry.current) return;

    shouldScrollToNewEntry.current = false;
    const newEntry = entryRefs.current[entries.length - 1];
    if (!newEntry) return;

    requestAnimationFrame(() => {
      newEntry.scrollIntoView({ behavior: "smooth", block: "center" });
      newEntry.querySelector("textarea")?.focus();
    });
  }, [entries.length]);

  const invalidDate =
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d) ||
    d < 1 ||
    d > daysInMonth(y, m);

  if (invalidDate) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader />
        <main className="max-w-2xl mx-auto p-6">
          <p>Data inválida.</p>
          <Button onClick={() => navigate(`/?year=${y}&month=${m}`)} className="mt-4">
            Voltar
          </Button>
        </main>
      </div>
    );
  }

  const updateEntry = (idx, next) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? next : e)));
  };
  const addEntry = () => {
    shouldScrollToNewEntry.current = true;
    setEntries((prev) => [...prev, { ...EMPTY_ENTRY }]);
  };
  const removeEntry = (idx) =>
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const handleSave = () => {
    const cleaned = entries
      .map((e) => ({
        division: (e.division || "").trim(),
        activity: (e.activity || "").trim(),
        place: (e.place || "").trim(),
        time: (e.time || "").trim(),
      }))
      .filter((e) => e.activity);
    if (cleaned.length === 0) {
      toast.error("Informe pelo menos uma atividade.");
      return;
    }
    saveActivities(y, m, d, cleaned);
    toast.success(
      cleaned.length > 1
        ? `${cleaned.length} atividades salvas!`
        : "Atividade salva!",
    );
    navigate(`/?year=${y}&month=${m}`);
  };

  const handleDelete = () => {
    deleteActivity(y, m, d);
    toast.success("Atividades excluídas.");
    navigate(`/?year=${y}&month=${m}`);
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader
        right={
          <Button
            variant="ghost"
            onClick={() => navigate(`/?year=${y}&month=${m}`)}
            data-testid="back-home-btn"
            className="text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        }
      />

      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <div
          className="rounded-2xl bg-white shadow-sm border p-5 sm:p-7"
          style={{ borderColor: "var(--hairline)" }}
          data-testid="activity-form-card"
        >
          {/* Header banner */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <div
                className="text-xs uppercase tracking-widest font-semibold"
                style={{ color: "var(--brand-red)" }}
              >
                {existing ? "Editando atividade" : "Nova atividade"}
              </div>
              <h1
                className="font-display text-3xl sm:text-4xl mt-1"
                style={{ color: "var(--ink)" }}
                data-testid="activity-date-heading"
              >
                Dia {d}
                <span
                  className="text-lg font-normal ml-2"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {weekdayFullOfDay(y, m, d)}
                </span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
                {MONTHS_PT[m]} de {y}
              </p>
            </div>
            <div
              className="hidden sm:flex flex-col items-center justify-center rounded-xl w-16 h-16 shadow-sm"
              style={{ background: "var(--brand-yellow)" }}
            >
              <span
                className="text-2xl font-black leading-none"
                style={{ color: "var(--brand-red)" }}
              >
                {d}
              </span>
              <span
                className="text-[10px] uppercase tracking-wider mt-1"
                style={{ color: "var(--ink)" }}
              >
                {MONTHS_PT[m].slice(0, 3)}
              </span>
            </div>
          </div>

          {/* Entries */}
          <div className="space-y-4">
            {entries.map((entry, idx) => (
              <EntryCard
                key={idx}
                index={idx}
                total={entries.length}
                entry={entry}
                divisions={settings.divisions}
                onChange={(next) => updateEntry(idx, next)}
                onRemove={() => removeEntry(idx)}
                cardRef={(element) => {
                  entryRefs.current[idx] = element;
                }}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addEntry}
            data-testid="add-entry-btn"
            className="w-full mt-4 border-dashed h-11"
            style={{
              borderColor: "var(--brand-blue)",
              color: "var(--brand-blue)",
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar outra atividade neste dia
          </Button>

          {/* Actions */}
          <div
            className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8 pt-6 border-t"
            style={{ borderColor: "var(--hairline)" }}
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  data-testid="delete-activity-btn"
                  className="border-red-300"
                  style={{ color: "var(--brand-red)" }}
                  disabled={!existing}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir dia
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir atividades?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá todas as atividades do dia {d} de{" "}
                    {MONTHS_PT[m]} de {y}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="delete-cancel-btn">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="delete-confirm-btn"
                    onClick={handleDelete}
                    style={{ background: "var(--brand-red)", color: "white" }}
                  >
                    Sim, excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-3 sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => navigate(`/?year=${y}&month=${m}`)}
                data-testid="cancel-activity-btn"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                data-testid="save-activity-btn"
                className="min-w-32"
                style={{ background: "var(--brand-blue)", color: "white" }}
              >
                <Save className="h-4 w-4 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
