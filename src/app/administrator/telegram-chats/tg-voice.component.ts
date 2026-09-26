import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";

/**
 * A voice-message player shaped like Telegram's, instead of the browser's
 * default <audio controls> — which is a different widget in every browser and
 * far too wide for a chat bubble.
 *
 * The waveform is real. Telegram's Bot API does not send the waveform data it
 * shows in its own clients (that lives in MTProto), so the file is decoded here
 * with the Web Audio API and its peaks measured. Where a browser cannot decode
 * Opus — Safari, mainly — a neutral pattern is drawn instead, so the control
 * still looks deliberate rather than broken.
 */
@Component({
  selector: "app-tg-voice",
  templateUrl: "./tg-voice.component.html",
  styleUrls: ["./tg-voice.component.css"],
})
export class TgVoiceComponent implements OnInit, OnDestroy {
  @Input() src!: string;
  /** Telegram's own duration, used before metadata has loaded. */
  @Input() duration: number | null = null;
  @Input() outgoing = false;

  @ViewChild("bars", { static: true }) barsRef!: ElementRef<HTMLDivElement>;

  playing = false;
  current = 0;
  total = 0;
  speed = 1;
  /** Peak heights, 0..1. Decorative until the decode finishes. */
  levels: number[] = [];
  decoded = false;

  private audio: HTMLAudioElement | null = null;
  private observer: IntersectionObserver | null = null;

  /**
   * One AudioContext for the whole page. Browsers cap how many can exist, and
   * a chat can hold dozens of voice messages.
   */
  private static sharedContext: AudioContext | null = null;

  private static context(): AudioContext | null {
    if (TgVoiceComponent.sharedContext) return TgVoiceComponent.sharedContext;
    const Ctor =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    TgVoiceComponent.sharedContext = new Ctor();
    return TgVoiceComponent.sharedContext;
  }

  /** Decoded waveforms, keyed by URL, so re-rendering does not re-download. */
  private static cache = new Map<string, number[]>();

  readonly BAR_COUNT = 42;

  ngOnInit(): void {
    this.total = this.duration || 0;
    this.levels = this.placeholderLevels();

    const cached = TgVoiceComponent.cache.get(this.src);
    if (cached) {
      this.levels = cached;
      this.decoded = true;
      return;
    }

    // Decoding means downloading the file, so it waits until the message is
    // actually on screen. A long history holds a lot of voice notes nobody
    // scrolls to.
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.observer?.disconnect();
          this.observer = null;
          this.buildWaveform();
        }
      });
      this.observer.observe(this.barsRef.nativeElement);
    } else {
      this.buildWaveform();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
  }

  /**
   * A steady pattern for before the decode lands, and for browsers that cannot
   * decode Opus at all. Derived from the URL so a given message always looks
   * the same rather than reshuffling on every render.
   */
  private placeholderLevels(): number[] {
    let seed = 0;
    for (const ch of this.src || "") seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const out: number[] = [];
    for (let i = 0; i < this.BAR_COUNT; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      out.push(0.3 + ((seed >>> 16) % 100) / 200); // 0.30 – 0.80
    }
    return out;
  }

  private async buildWaveform(): Promise<void> {
    const ctx = TgVoiceComponent.context();
    if (!ctx) return;

    try {
      const response = await fetch(this.src);
      if (!response.ok) return;
      const buffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(buffer.slice(0));

      const data = audioBuffer.getChannelData(0);
      const block = Math.floor(data.length / this.BAR_COUNT) || 1;
      const peaks: number[] = [];

      for (let i = 0; i < this.BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < block; j++) sum += Math.abs(data[i * block + j] || 0);
        peaks.push(sum / block);
      }

      const max = Math.max(...peaks) || 1;
      // A floor, so a silent stretch is still a visible bar rather than a gap.
      this.levels = peaks.map((p) => Math.max(0.12, p / max));
      this.decoded = true;
      TgVoiceComponent.cache.set(this.src, this.levels);

      if (!this.total) this.total = audioBuffer.duration;
    } catch (e) {
      // Safari cannot decode Opus. The placeholder stays, and playback is
      // unaffected — <audio> handles the format even when Web Audio will not.
    }
  }

  // ---------------------------------------------------------------- playback

  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio;

    const audio = new Audio(this.src);
    audio.preload = "metadata";
    audio.playbackRate = this.speed;

    audio.addEventListener("loadedmetadata", () => {
      // Telegram's duration is authoritative for Opus: some browsers report
      // Infinity for a streamed Ogg until it has played through.
      if (isFinite(audio.duration) && audio.duration > 0 && !this.duration) {
        this.total = audio.duration;
      }
    });
    audio.addEventListener("timeupdate", () => (this.current = audio.currentTime));
    audio.addEventListener("ended", () => {
      this.playing = false;
      this.current = 0;
    });
    audio.addEventListener("pause", () => (this.playing = false));
    audio.addEventListener("play", () => (this.playing = true));

    this.audio = audio;
    return audio;
  }

  toggle(): void {
    const audio = this.ensureAudio();
    if (this.playing) {
      audio.pause();
    } else {
      // Only one voice message plays at a time, as in any chat client.
      document.querySelectorAll("audio").forEach((el: any) => {
        if (el !== audio) el.pause();
      });
      audio.play().catch(() => (this.playing = false));
    }
  }

  cycleSpeed(): void {
    this.speed = this.speed === 1 ? 1.5 : this.speed === 1.5 ? 2 : 1;
    if (this.audio) this.audio.playbackRate = this.speed;
  }

  seek(event: MouseEvent): void {
    const el = this.barsRef.nativeElement;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const target = ratio * (this.total || 0);
    if (!this.total) return;

    const audio = this.ensureAudio();
    try {
      audio.currentTime = target;
      this.current = target;
    } catch (e) {
      /* not seekable yet */
    }
  }

  // ----------------------------------------------------------------- display

  get progress(): number {
    return this.total ? Math.min(1, this.current / this.total) : 0;
  }

  /** True for bars already played, which are drawn in the accent colour. */
  isPlayed(index: number): boolean {
    return index / this.BAR_COUNT < this.progress;
  }

  format(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  trackBar(index: number): number {
    return index;
  }
}
