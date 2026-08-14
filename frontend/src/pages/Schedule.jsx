import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { SchedulePreview } from "../components/SchedulePreview";
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
import { ArrowLeft, FileDown, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MONTHS_PT } from "../lib/date-utils";
import {
  loadMonth,
  loadSettings,
  deleteMonth,
} from "../lib/storage";
import { buildMonthPdfFile, downloadMonthPdf } from "../lib/pdf";

export default function Schedule() {
  const { year, month } = useParams();
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings());
  const [monthData, setMonthData] = useState({});
  const previewRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState(0);

  useEffect(() => {
    setSettings(loadSettings());
    setMonthData(loadMonth(y, m));
  }, [y, m]);

  // Fit preview to container width and measure natural height
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById("preview-container");
      if (!container) return;
      const w = container.clientWidth - 24; // account for padding
      const scale = Math.min(1, w / 720);
      setPreviewScale(scale);
      // measure natural rendered height of preview content
      if (previewRef.current) {
        // Reset any prior transform to measure natural size
        const el = previewRef.current;
        const prevTransform = el.style.transform;
        el.style.transform = "none";
        const naturalH = el.getBoundingClientRect().height;
        el.style.transform = prevTransform;
        setPreviewHeight(Math.ceil(naturalH * scale) + 16);
      }
    };
    updateSize();
    // recompute after content settles
    const t = setTimeout(updateSize, 100);
    window.addEventListener("resize", updateSize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateSize);
    };
  }, [monthData, settings]);

  const count = useMemo(
    () =>
      Object.values(monthData).reduce(
        (sum, entries) => sum + (Array.isArray(entries) ? entries.length : 1),
        0,
      ),
    [monthData],
  );

  const handleDownload = () => {
    downloadMonthPdf({ year: y, month: m, settings, monthData });
    toast.success("PDF gerado! Verifique seus downloads.");
  };

  const handleShareWhatsApp = async () => {
    try {
      const file = buildMonthPdfFile({ year: y, month: m, settings, monthData });
      const shareData = {
        files: [file],
        title: `Programação ${MONTHS_PT[m]} ${y}`,
        text: `Programação de ${MONTHS_PT[m]} - ${settings.header.community}`,
      };
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        await navigator.share(shareData);
        return;
      }
      // Fallback: download PDF and open WhatsApp Web
      downloadMonthPdf({ year: y, month: m, settings, monthData });
      const text = encodeURIComponent(
        `📅 *Programação de ${MONTHS_PT[m]} ${y}*\n${settings.header.community}\n\n(Anexe o PDF baixado.)`,
      );
      window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
      toast.info("PDF baixado. Anexe-o no WhatsApp aberto.");
    } catch (err) {
      if (err && err.name === "AbortError") return;
      toast.error("Não foi possível compartilhar. PDF baixado como alternativa.");
      downloadMonthPdf({ year: y, month: m, settings, monthData });
    }
  };

  const handleDeleteMonth = () => {
    deleteMonth(y, m);
    toast.success("Programação do mês excluída.");
    navigate(`/?year=${y}&month=${m}`);
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
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

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div
              className="text-xs uppercase tracking-widest font-semibold"
              style={{ color: "var(--brand-red)" }}
            >
              PROGRAMAÇÃO DO MÊS
            </div>
            <h1 className="font-display text-3xl sm:text-4xl mt-1" data-testid="schedule-heading">
              {MONTHS_PT[m]}{" "}
              <span style={{ color: "var(--brand-blue)" }}>{y}</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
              {count} atividade{count !== 1 ? "s" : ""} cadastrada{count !== 1 ? "s" : ""}.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div
          id="preview-container"
          className="rounded-2xl border shadow-sm bg-white p-3 sm:p-5 overflow-hidden"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div
            style={{
              width: "100%",
              height: previewHeight ? `${previewHeight}px` : "auto",
              overflow: "hidden",
            }}
          >
            <SchedulePreview
              ref={previewRef}
              year={y}
              month={m}
              settings={settings}
              monthData={monthData}
              scale={previewScale}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={handleShareWhatsApp}
            data-testid="share-whatsapp-btn"
            className="w-full h-12 text-base"
            style={{ background: "#25D366", color: "white" }}
          >
            <Share2 className="h-4 w-4 mr-2" /> Enviar por WhatsApp
          </Button>
          <Button
            onClick={handleDownload}
            data-testid="download-pdf-btn"
            variant="outline"
            className="w-full h-12 text-base"
            style={{
              borderColor: "var(--brand-blue)",
              color: "var(--brand-blue)",
            }}
          >
            <FileDown className="h-4 w-4 mr-2" /> Baixar PDF
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                data-testid="delete-month-btn"
                className="w-full h-12 text-base"
                style={{ borderColor: "var(--brand-red)", color: "var(--brand-red)" }}
                disabled={count === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Excluir mês
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir programação inteira?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todas as atividades de {MONTHS_PT[m]} de {y} serão removidas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="del-month-cancel">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  data-testid="del-month-confirm"
                  onClick={handleDeleteMonth}
                  style={{ background: "var(--brand-red)", color: "white" }}
                >
                  Sim, excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}
