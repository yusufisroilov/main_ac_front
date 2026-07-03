import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";

interface VideoLesson {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  playlist: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  embedUrl?: SafeResourceUrl;
}

interface PlaylistGroup {
  name: string | null; // null = uncategorized
  label: string;
  lessons: VideoLesson[];
}

@Component({
  selector: "app-video-lessons",
  templateUrl: "./video-lessons.component.html",
  styleUrls: ["./video-lessons.component.css"],
})
export class VideoLessonsComponent implements OnInit {
  lessons: VideoLesson[] = [];
  filtered: VideoLesson[] = [];
  groups: PlaylistGroup[] = [];
  searchQuery = "";
  loading = false;
  canManage = !["CLIENT"].includes(localStorage.getItem("role") || "");

  /** Labels of playlists the user has collapsed (persists across re-filters). */
  collapsedPlaylists = new Set<string>();

  togglePlaylist(group: PlaylistGroup) {
    if (this.collapsedPlaylists.has(group.label)) {
      this.collapsedPlaylists.delete(group.label);
    } else {
      this.collapsedPlaylists.add(group.label);
    }
  }

  isCollapsed(group: PlaylistGroup): boolean {
    return this.collapsedPlaylists.has(group.label);
  }

  /** Distinct playlist names across all lessons (for the create/edit datalist). */
  get playlistNames(): string[] {
    const set = new Set<string>();
    for (const l of this.lessons) {
      if (l.playlist && l.playlist.trim()) set.add(l.playlist.trim());
    }
    return [...set].sort();
  }

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.loadLessons();
  }

  loadLessons() {
    this.loading = true;
    this.http
      .get<any>(`${GlobalVars.baseUrl}/video-lessons?active=false`, {
        headers: this.getHeaders(),
      })
      .subscribe(
        (data) => {
          this.lessons = data.lessons || [];
          this.applyFilter();
          this.loading = false;
        },
        () => (this.loading = false),
      );
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filtered = this.lessons;
    } else {
      this.filtered = this.lessons.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.description || "").toLowerCase().includes(q) ||
          (l.playlist || "").toLowerCase().includes(q),
      );
    }
    this.buildGroups();
  }

  /** Group the filtered lessons by playlist; named playlists first, uncategorized last. */
  private buildGroups() {
    const map = new Map<string | null, VideoLesson[]>();
    for (const l of this.filtered) {
      const key = l.playlist && l.playlist.trim() ? l.playlist.trim() : null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    const groups: PlaylistGroup[] = [];
    for (const [name, lessons] of map.entries()) {
      if (name === null) continue;
      groups.push({ name, label: name, lessons });
    }
    groups.sort((a, b) => a.label.localeCompare(b.label));
    if (map.has(null)) {
      groups.push({
        name: null,
        label: "Boshqa (playlistsiz)",
        lessons: map.get(null)!,
      });
    }
    this.groups = groups;
  }

  getVideoId(url: string): string | null {
    if (!url) return null;
    try {
      const u = new URL(url.trim());
      // youtu.be/VIDEO_ID
      if (u.hostname.includes("youtu.be")) {
        const seg = u.pathname.split("/").filter(Boolean)[0];
        if (seg) return seg;
      }
      // youtube.com/watch?v=VIDEO_ID (and m.youtube.com)
      if (u.hostname.includes("youtube.com")) {
        if (u.searchParams.has("v")) return u.searchParams.get("v");
        // /embed/ID , /shorts/ID , /live/ID , /v/ID
        const parts = u.pathname.split("/").filter(Boolean);
        const marker = parts.findIndex((p) =>
          ["embed", "shorts", "live", "v"].includes(p),
        );
        if (marker !== -1 && parts[marker + 1]) return parts[marker + 1];
      }
    } catch (_) {
      // Not a full URL — maybe a bare 11-char video id was pasted
      const m = url.trim().match(/^[a-zA-Z0-9_-]{11}$/);
      if (m) return url.trim();
    }
    return null;
  }

  getThumbnail(url: string): string {
    const vid = this.getVideoId(url);
    return vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : "";
  }

  getEmbedUrl(url: string): SafeResourceUrl | null {
    const vid = this.getVideoId(url);
    if (!vid) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`,
    );
  }

  // ── Modal player ──────────────────────────────────────────────
  playingLesson: VideoLesson | null = null;
  playingEmbedUrl: SafeResourceUrl | null = null;

  playVideo(lesson: VideoLesson) {
    this.playingLesson = lesson;
    this.playingEmbedUrl = this.getEmbedUrl(lesson.youtube_url);
  }

  closePlayer() {
    this.playingLesson = null;
    this.playingEmbedUrl = null;
  }

  addLesson() {
    this.openLessonDialog(null);
  }

  editLesson(lesson: VideoLesson) {
    this.openLessonDialog(lesson);
  }

  private openLessonDialog(existing: VideoLesson | null) {
    const isEdit = !!existing;

    const html = `
      <style>
        .vl-form { display:flex; flex-direction:column; gap:14px; text-align:left; }
        .vl-form label { font-size:12px; font-weight:600; color:#555; display:block; margin-bottom:4px; text-transform:uppercase; }
        .vl-form label .req { color:#e53935; margin-left:2px; }
        .vl-form .form-control { border-radius:6px; border:1.5px solid #ddd; padding:10px 12px; font-size:14px; width:100%; box-sizing:border-box; }
        .vl-form textarea.form-control { min-height:80px; resize:vertical; }
      </style>
      <div class="vl-form">
        <div>
          <label>Sarlavha<span class="req">*</span></label>
          <input id="vl-title" type="text" class="form-control" value="${existing?.title || ""}" placeholder="Video nomi">
        </div>
        <div>
          <label>Tavsif</label>
          <textarea id="vl-desc" class="form-control" placeholder="Qisqacha tavsif...">${existing?.description || ""}</textarea>
        </div>
        <div>
          <label>YouTube Havola<span class="req">*</span></label>
          <input id="vl-url" type="text" class="form-control" value="${existing?.youtube_url || ""}" placeholder="https://www.youtube.com/watch?v=...">
        </div>
        <div>
          <label>Playlist</label>
          <input id="vl-playlist" type="text" class="form-control" list="vl-playlist-options"
                 value="${(existing?.playlist || "").replace(/"/g, "&quot;")}"
                 placeholder="Masalan: Taobao'dan qanday foydalanish">
          <datalist id="vl-playlist-options">
            ${this.playlistNames.map((p) => `<option value="${p.replace(/"/g, "&quot;")}"></option>`).join("")}
          </datalist>
          <small style="color:#888; font-size:11px;">Bir xil nom yozsangiz, videolar bitta playlistga birlashadi.</small>
        </div>
        <div>
          <label>Tartib Raqami</label>
          <input id="vl-order" type="number" class="form-control" value="${existing?.display_order ?? 0}" placeholder="0">
        </div>
      </div>`;

    swal
      .fire({
        title: isEdit ? "Videoni Tahrirlash" : "Yangi Video Qo'shish",
        html,
        width: "min(560px, 95vw)",
        showCancelButton: true,
        confirmButtonText: isEdit ? "Saqlash" : "Qo'shish",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const title = (document.getElementById("vl-title") as HTMLInputElement).value.trim();
          const url = (document.getElementById("vl-url") as HTMLInputElement).value.trim();

          if (!title) {
            swal.showValidationMessage("Sarlavha majburiy");
            return false;
          }
          if (!url) {
            swal.showValidationMessage("YouTube havola majburiy");
            return false;
          }

          return {
            title,
            description: (document.getElementById("vl-desc") as HTMLTextAreaElement).value.trim() || null,
            youtube_url: url,
            playlist: (document.getElementById("vl-playlist") as HTMLInputElement).value.trim() || null,
            display_order: parseInt((document.getElementById("vl-order") as HTMLInputElement).value) || 0,
          };
        },
      })
      .then((result) => {
        if (!result.isConfirmed || !result.value) return;
        const req = isEdit
          ? this.http.put<any>(`${GlobalVars.baseUrl}/video-lessons/${existing!.id}`, result.value, { headers: this.getHeaders() })
          : this.http.post<any>(`${GlobalVars.baseUrl}/video-lessons`, result.value, { headers: this.getHeaders() });

        req.subscribe(
          (data) => {
            if (data.status === "ok") {
              swal.fire({ icon: "success", title: "Saqlandi!", timer: 1200, showConfirmButton: false });
              this.loadLessons();
            } else {
              swal.fire("Xatolik", data.error, "error");
            }
          },
          (err) => swal.fire("Xatolik", err.error?.error || "Xatolik yuz berdi", "error"),
        );
      });
  }

  deleteLesson(lesson: VideoLesson) {
    swal
      .fire({
        title: "O'chirish",
        text: `"${lesson.title}" videosini o'chirishni tasdiqlaysizmi?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ha, o'chirish",
        cancelButtonText: "Bekor",
        customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
        buttonsStyling: false,
      })
      .then((result) => {
        if (!result.isConfirmed) return;
        this.http
          .delete<any>(`${GlobalVars.baseUrl}/video-lessons/${lesson.id}`, { headers: this.getHeaders() })
          .subscribe(
            () => {
              swal.fire({ icon: "success", title: "O'chirildi!", timer: 1200, showConfirmButton: false });
              this.loadLessons();
            },
            (err) => swal.fire("Xatolik", err.error?.error || "Xatolik yuz berdi", "error"),
          );
      });
  }

  toggleActive(lesson: VideoLesson) {
    this.http
      .put<any>(
        `${GlobalVars.baseUrl}/video-lessons/${lesson.id}`,
        { is_active: !lesson.is_active },
        { headers: this.getHeaders() },
      )
      .subscribe(() => this.loadLessons());
  }
}
