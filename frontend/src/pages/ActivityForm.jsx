import React, { useEffect, useState } from "react";
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
import { ArrowLeft, Trash2, Save, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  loadMonth,
  loadSettings,
  saveActivity,
  deleteActivity,
} from "../lib/storage";
import {
  MONTHS_PT,
  weekdayFullOfDay,
  daysInMonth,
} from "../lib/date-utils";

export default function ActivityForm() {
  const { year, month, day } = useParams();
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  const navigate = useNavigate();

  const [settings] = useState(loadSettings());
  const [form, setForm] = useState({
    division: "",
    activity: "",
    place: "",
    time: "",
  });
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    const monthData = loadMonth(y, m);
    if (monthData[d]) {
      setForm({
        division: monthData[d].division || "",
        activity: monthData[d].activity || "",
        place: monthData[d].place || "",
        time: monthData[d].time || "",
      });
      setExisting(true);
    }
  }, [y, m, d]);

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
          <Button onClick={() => navigate("/")} className="mt-4">
            Voltar
          </Button>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    if (!form.activity.trim()) {
      toast.error("Informe pelo menos a atividade.");
      return;
    }
    saveActivity(y, m, d, {
      division: form.division.trim(),
      activity: form.activity.trim(),
      place: form.place.trim(),
      time: form.time.trim(),
    });
    toast.success("Atividade salva!");
    navigate("/");
  };

  const handleDelete = () => {
    deleteActivity(y, m, d);
    toast.success("Atividade excluída.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader
        right={
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
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
          {/* Selected date banner */}
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
                <span className="text-lg font-normal ml-2" style={{ color: "var(--ink-soft)" }}>
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

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="division">Divisão</Label>
              <Select
                value={form.division || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, division: v }))}
              >
                <SelectTrigger id="division" data-testid="division-select">
                  <SelectValue placeholder="Selecione uma divisão" />
                </SelectTrigger>
                <SelectContent>
                  {settings.divisions.map((div) => (
                    <SelectItem key={div} value={div} data-testid={`division-option-${div}`}>
                      {div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                As divisões podem ser gerenciadas em Ajustes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Atividade</Label>
              <Textarea
                id="activity"
                data-testid="activity-input"
                rows={2}
                value={form.activity}
                onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value }))}
                placeholder="Ex: Daimoku da Comunidade Putim - Vitória Total"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="place">
                  <MapPin className="inline h-3.5 w-3.5 mr-1" /> Local
                </Label>
                <Input
                  id="place"
                  data-testid="place-input"
                  value={form.place}
                  onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))}
                  placeholder="Ex: Res. Sra. Zilda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">
                  <Clock className="inline h-3.5 w-3.5 mr-1" /> Horário
                </Label>
                <Input
                  id="time"
                  data-testid="time-input"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8 pt-6 border-t"
               style={{ borderColor: "var(--hairline)" }}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  data-testid="delete-activity-btn"
                  className="border-red-300"
                  style={{ color: "var(--brand-red)" }}
                  disabled={!existing}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá a atividade do dia {d} de {MONTHS_PT[m]} de {y}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="delete-cancel-btn">Cancelar</AlertDialogCancel>
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
                onClick={() => navigate("/")}
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
