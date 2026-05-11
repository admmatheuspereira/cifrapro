import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Edit2, Trash2, ArrowUp, ArrowDown, RotateCcw, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { transposeContent, transposeKey } from "../utils/transpose";
import { Button } from "../components/ui/button";
import { Modal } from "../components/Modal";

export default function CifraDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { cifras, deleteCifra } = useAppStore();

  const cifraId = params.id as string;
  const cifra = cifras.find(c => c.id === cifraId);

  const [semitones, setSemitones] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Auto-scroll state
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<1 | 2 | 3>(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const scrollPauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAccRef = useRef(0);

  // Map speed levels to px/frame values
  const speedPxMap: Record<number, number> = { 1: 0.4, 2: 0.9, 3: 1.8 };

  // Redirect if not found
  useEffect(() => {
    if (!cifra && !showDeleteModal) {
      setLocation("/cifras");
    }
  }, [cifra, setLocation, showDeleteModal]);

  // Cleanup auto-scroll on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (scrollPauseTimerRef.current) clearTimeout(scrollPauseTimerRef.current);
    };
  }, []);

  const startScrolling = useCallback(() => {
    if (!scrollContainerRef.current || !isScrolling) return;

    const pxPerFrame = speedPxMap[scrollSpeed] ?? 0.4;
    scrollAccRef.current += pxPerFrame;

    if (scrollAccRef.current >= 1) {
      const toScroll = Math.floor(scrollAccRef.current);
      scrollContainerRef.current.scrollTop += toScroll;
      scrollAccRef.current -= toScroll;
    }

    animationRef.current = requestAnimationFrame(startScrolling);
  }, [isScrolling, scrollSpeed]);

  useEffect(() => {
    scrollAccRef.current = 0;
    if (isScrolling) {
      animationRef.current = requestAnimationFrame(startScrolling);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isScrolling, startScrolling]);

  const handleUserScroll = useCallback(() => {
    if (!isScrolling) return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    if (scrollPauseTimerRef.current) clearTimeout(scrollPauseTimerRef.current);
    scrollPauseTimerRef.current = setTimeout(() => {
      if (isScrolling) {
        scrollAccRef.current = 0;
        animationRef.current = requestAnimationFrame(startScrolling);
      }
    }, 2000);
  }, [isScrolling, startScrolling]);

  if (!cifra) return null;

  const currentKey = transposeKey(cifra.key, semitones);
  const currentContent = semitones !== 0 ? transposeContent(cifra.content, semitones) : cifra.content;

  const handleDelete = () => {
    deleteCifra(cifra.id);
    toast.success("Cifra excluída!");
    setLocation("/cifras");
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      {/* Top Toolbar */}
      <header className="shrink-0 border-b border-border bg-sidebar/80 backdrop-blur safe-top">
        {/* Row 1: Navigation */}
        <div className="flex items-center justify-between px-2 py-2">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/cifras")} data-testid="button-cifra-back">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setLocation(`/cifras/${cifra.id}/editar`)} data-testid="button-cifra-edit">
              <Edit2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteModal(true)} data-testid="button-cifra-delete">
              <Trash2 size={18} />
            </Button>
          </div>
        </div>

        {/* Row 2: Musical Controls */}
        <div className="flex flex-row gap-2 px-3 pb-2.5 items-center justify-between">

          {/* Transpose Controls */}
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1 flex-1">
            <div className="px-2 flex items-center justify-center min-w-[52px] font-medium text-primary text-sm">
              {currentKey || '?'}
              {semitones !== 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({semitones > 0 ? '+' : ''}{semitones})
                </span>
              )}
            </div>
            <div className="w-px h-5 bg-border" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSemitones(s => s - 1)} data-testid="button-transpose-down">
              <ArrowDown size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSemitones(s => s + 1)} data-testid="button-transpose-up">
              <ArrowUp size={14} />
            </Button>
            <div className="w-px h-5 bg-border" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSemitones(0)} disabled={semitones === 0} data-testid="button-transpose-reset">
              <RotateCcw size={13} />
            </Button>
          </div>

          {/* Auto-scroll Controls */}
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1">
            <Button
              variant={isScrolling ? "default" : "secondary"}
              className="h-7 px-3 text-xs font-medium"
              onClick={() => setIsScrolling(!isScrolling)}
              data-testid="button-autoscroll-toggle"
            >
              {isScrolling ? <Pause size={13} className="mr-1" /> : <Play size={13} className="mr-1" />}
              Rolagem
            </Button>
            <div className="w-px h-5 bg-border" />
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs px-2 ${scrollSpeed === 1 ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setScrollSpeed(1)}
                data-testid="button-autoscroll-slow"
              >
                1x
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs px-2 ${scrollSpeed === 2 ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setScrollSpeed(2)}
                data-testid="button-autoscroll-med"
              >
                2x
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs px-2 ${scrollSpeed === 3 ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setScrollSpeed(3)}
                data-testid="button-autoscroll-fast"
              >
                3x
              </Button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Scrollable Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto w-full"
        onTouchStart={handleUserScroll}
        onWheel={handleUserScroll}
      >
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-16">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">{cifra.title}</h1>
            {cifra.artist && <p className="text-lg text-muted-foreground">{cifra.artist}</p>}
          </div>

          <div className="font-mono text-base md:text-lg leading-relaxed whitespace-pre-wrap">
            {currentContent}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Cifra"
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      >
        <p className="text-muted-foreground">Tem certeza que deseja excluir esta cifra? Esta ação não pode ser desfeita.</p>
      </Modal>
    </div>
  );
}
