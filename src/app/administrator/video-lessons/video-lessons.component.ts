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
  display_order: number;
  is_active: boolean;
  created_at: string;
  embedUrl?: SafeResourceUrl;
}

@Component({
  selector: "app-video-lessons",
  templateUrl: "./video-lessons.component.html",
  styleUrls: ["./video-lessons.component.css"],
})
export class VideoLessonsComponent implements OnInit {
  lessons: VideoLesson[] = [];
  filtered: VideoLesson[] = [];
  searchQuery = "";
  loading = false;
  canManage = !["CLIENT"].includes(localStorage.getItem("role") || "");

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
          this.lessons = (data.lessons || []).map((l: VideoLesson) => ({
            ...l,
            embedUrl: this.getEmbedUrl(l.youtube_url),
          }));
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
          (l.description || "").toLowerCase().includes(q),
      );
    }
  }

  getVideoId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com") && u.searchParams.has("v")) {
        return u.searchParams.get("v");
      }
      if (u.hostname.includes("youtu.be") && u.pathname.length > 1) {
        return u.pathname.substring(1);
      }
      if (u.pathname.includes("/embed/")) {
        return u.pathname.split("/embed/")[1];
      }
    } catch (_) {}
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
      `https://www.youtube.com/embed/${vid}`,
    );
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
