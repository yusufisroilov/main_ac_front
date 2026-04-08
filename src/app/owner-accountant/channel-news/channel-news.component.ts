import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

@Component({
  selector: "app-channel-news",
  templateUrl: "./channel-news.component.html",
  styleUrls: ["./channel-news.component.css"],
})
export class ChannelNewsComponent implements OnInit {
  posts: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  canManage = false;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    const role = localStorage.getItem("role");
    this.canManage = role === "MANAGER" || role === "OWNER";
    this.loadPosts();
  }

  loadPosts() {
    this.loading = true;
    const url = `${GlobalVars.baseUrl}/channel-posts?page=${this.currentPage}&size=${this.pageSize}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => {
        this.posts = data.posts || [];
        this.totalItems = data.totalItems || 0;
        this.totalPages = data.totalPages || 0;
        this.currentPage = data.currentPage || 0;
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        if (error.status === 403) this.authService.logout();
      },
    );
  }

  onPageChanged(page: number) {
    this.currentPage = page;
    this.loadPosts();
  }

  getMediaUrl(path: string): string {
    if (!path) return "";
    return GlobalVars.baseUrl + path;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year}  ${hours}:${mins}`;
  }

  linkify(text: string): string {
    if (!text) return "";
    // Escape HTML
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Convert "Label (URL)" patterns → clickable label
    html = html.replace(
      /(\S[^(\n]*?)\s*\(((https?:\/\/[^\s\)]+))\)/g,
      '<a href="$2" target="_blank" class="cn-link">$1</a>'
    );
    // Convert remaining standalone URLs
    html = html.replace(
      /(?<!href="|">)(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" class="cn-link">$1</a>'
    );
    // Convert bare domains (e.g. my.acargo.uz) — not already inside a tag
    html = html.replace(
      /(?<!href="|">[^\s]*|\/\/)(\b\w+\.\w+\.\w{2,})\b(?![^<]*>)/g,
      '<a href="https://$1" target="_blank" class="cn-link">$1</a>'
    );
    // Convert @username to Telegram links (not already inside a tag)
    html = html.replace(
      /(?<![\w\/])@(\w{5,})/g,
      '<a href="https://t.me/$1" target="_blank" class="cn-link">@$1</a>'
    );
    // Convert phone numbers
    html = html.replace(
      /(\+998[\d\s]{9,12})/g,
      '<a href="tel:$1" class="cn-link">$1</a>'
    );
    // Preserve newlines
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  private getPostFormHtml(existingText = ""): string {
    const emojis = ["✈️","📦","🚚","🎉","🔥","⚡","💰","📢","🆔","🕒","☎️","🌐","🤖","👨🏻‍💻","📞","📹","✅","❌","⭐","🏆"];
    const emojiButtons = emojis.map(e => `<button type="button" class="cp-emoji" data-emoji="${e}">${e}</button>`).join("");
    const escapedText = existingText.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `
      <style>
        .cp-form { text-align: left; }
        .cp-field { margin-bottom: 14px; }
        .cp-lbl { font-size: 11px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; display: block; }
        .cp-form .form-control { border-radius: 8px; border: 1.5px solid #e0e0e0; padding: 10px 12px; font-size: 14px; width: 100%; box-sizing: border-box; transition: border-color 0.2s; }
        .cp-form .form-control:focus { border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25,118,210,0.1); outline: none; }
        .cp-form textarea { min-height: 160px; resize: vertical; line-height: 1.6; font-family: inherit; }

        /* Toolbar */
        .cp-toolbar { display: flex; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; align-items: center; }
        .cp-tool-btn { background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: 12px; font-weight: 600; color: #555; transition: all 0.15s; display: inline-flex; align-items: center; gap: 4px; }
        .cp-tool-btn:hover { background: #e3f2fd; border-color: #90caf9; color: #1565c0; }
        .cp-tool-btn .mi { font-family: 'Material Icons'; font-size: 16px; }
        .cp-divider { width: 1px; height: 24px; background: #e0e0e0; margin: 0 2px; }

        /* Emoji bar */
        .cp-emoji-bar { display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 6px; }
        .cp-emoji { background: none; border: none; font-size: 18px; cursor: pointer; padding: 3px 4px; border-radius: 4px; transition: background 0.15s; line-height: 1; }
        .cp-emoji:hover { background: #f0f0f0; }

        /* Link dialog */
        .cp-link-dialog { display: none; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
        .cp-link-dialog.active { display: block; }
        .cp-link-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .cp-link-row input { flex: 1; padding: 7px 10px; border: 1.5px solid #ddd; border-radius: 6px; font-size: 13px; }
        .cp-link-row input:focus { border-color: #1976d2; outline: none; }
        .cp-link-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .cp-link-insert { background: #1976d2; color: #fff; border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .cp-link-insert:hover { background: #1565c0; }
        .cp-link-cancel { background: #eee; border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; cursor: pointer; }

        /* File upload area */
        .cp-drop-zone { border: 2px dashed #ddd; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
        .cp-drop-zone:hover, .cp-drop-zone.dragover { border-color: #1976d2; background: #e3f2fd; }
        .cp-drop-zone .mi { font-family: 'Material Icons'; font-size: 36px; color: #bbb; }
        .cp-drop-zone p { margin: 6px 0 0; font-size: 13px; color: #999; }
        .cp-drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .cp-file-preview { margin-top: 10px; display: none; }
        .cp-file-preview img { max-width: 100%; max-height: 180px; border-radius: 8px; }
        .cp-file-preview video { max-width: 100%; max-height: 180px; border-radius: 8px; }
        .cp-file-meta { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 8px 12px; background: #f5f5f5; border-radius: 8px; font-size: 12px; color: #666; }
        .cp-file-meta .mi { font-family: 'Material Icons'; font-size: 18px; color: #1976d2; }
        .cp-file-remove { margin-left: auto; background: none; border: none; color: #e53935; cursor: pointer; font-size: 18px; font-family: 'Material Icons'; }

        /* Live preview */
        .cp-preview-section { margin-top: 6px; }
        .cp-preview-toggle { font-size: 12px; color: #1976d2; background: none; border: none; cursor: pointer; font-weight: 600; padding: 0; }
        .cp-preview-box { margin-top: 8px; padding: 14px 16px; background: #fafafa; border: 1px solid #eee; border-radius: 10px; font-size: 14px; line-height: 1.7; color: #333; word-break: break-word; display: none; max-height: 200px; overflow-y: auto; }
        .cp-preview-box.active { display: block; }
        .cp-preview-box a { color: #1976d2; text-decoration: none; font-weight: 500; }
      </style>

      <div class="cp-form">
        <!-- Toolbar -->
        <span class="cp-lbl">Matn</span>
        <div class="cp-toolbar">
          <button type="button" class="cp-tool-btn" id="cp-link-btn"><span class="mi">link</span> Havola</button>
          <button type="button" class="cp-tool-btn" id="cp-phone-btn"><span class="mi">phone</span> Telefon</button>
          <button type="button" class="cp-tool-btn" id="cp-mention-btn"><span class="mi">alternate_email</span> @mention</button>
          <span class="cp-divider"></span>
          <button type="button" class="cp-tool-btn" id="cp-template-btn"><span class="mi">description</span> Shablon</button>
        </div>

        <!-- Emoji bar -->
        <div class="cp-emoji-bar">${emojiButtons}</div>

        <!-- Link insert dialog -->
        <div class="cp-link-dialog" id="cp-link-dialog">
          <div class="cp-link-row">
            <input type="text" id="cp-link-label" placeholder="Ko'rinadigan matn (masalan: Instagram)">
            <input type="text" id="cp-link-url" placeholder="URL (masalan: https://instagram.com/...)">
          </div>
          <div class="cp-link-actions">
            <button type="button" class="cp-link-cancel" id="cp-link-cancel">Bekor</button>
            <button type="button" class="cp-link-insert" id="cp-link-insert">Qo'shish</button>
          </div>
        </div>

        <!-- Text area -->
        <div class="cp-field" style="margin-bottom:8px;">
          <textarea id="cp-text" class="form-control" placeholder="Post matnini yozing...">${escapedText}</textarea>
        </div>

        <!-- Live preview toggle -->
        <div class="cp-preview-section">
          <button type="button" class="cp-preview-toggle" id="cp-preview-toggle">Ko'rish &#9660;</button>
          <div class="cp-preview-box" id="cp-preview-box"></div>
        </div>

        <!-- File upload -->
        <div class="cp-field" style="margin-top:14px;">
          <span class="cp-lbl">Media (rasm, video, hujjat)</span>
          <div class="cp-drop-zone" id="cp-drop-zone">
            <span class="mi">cloud_upload</span>
            <p>Faylni tanlang yoki shu yerga tashlang</p>
            <input id="cp-file" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx">
          </div>
          <div class="cp-file-preview" id="cp-file-preview">
            <div id="cp-file-media"></div>
            <div class="cp-file-meta" id="cp-file-meta">
              <span class="mi">attach_file</span>
              <span id="cp-file-name"></span>
              <span id="cp-file-size"></span>
              <button type="button" class="cp-file-remove" id="cp-file-remove" title="Olib tashlash">close</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  private setupPostFormEvents(textEl: HTMLTextAreaElement) {
    const linkDialog = document.getElementById("cp-link-dialog")!;
    const linkLabelInput = document.getElementById("cp-link-label") as HTMLInputElement;
    const linkUrlInput = document.getElementById("cp-link-url") as HTMLInputElement;
    const previewBox = document.getElementById("cp-preview-box")!;
    const fileInput = document.getElementById("cp-file") as HTMLInputElement;
    const dropZone = document.getElementById("cp-drop-zone")!;
    const filePreview = document.getElementById("cp-file-preview")!;
    const fileMedia = document.getElementById("cp-file-media")!;
    const fileNameEl = document.getElementById("cp-file-name")!;
    const fileSizeEl = document.getElementById("cp-file-size")!;

    // Insert text at cursor
    const insertAtCursor = (insertion: string) => {
      const start = textEl.selectionStart;
      const end = textEl.selectionEnd;
      textEl.value = textEl.value.substring(0, start) + insertion + textEl.value.substring(end);
      textEl.selectionStart = textEl.selectionEnd = start + insertion.length;
      textEl.focus();
    };

    // Emoji buttons
    document.querySelectorAll(".cp-emoji").forEach(btn => {
      btn.addEventListener("click", () => insertAtCursor((btn as HTMLElement).dataset["emoji"] || ""));
    });

    // Link button
    document.getElementById("cp-link-btn")!.addEventListener("click", () => {
      linkDialog.classList.toggle("active");
      if (linkDialog.classList.contains("active")) linkLabelInput.focus();
    });
    document.getElementById("cp-link-cancel")!.addEventListener("click", () => {
      linkDialog.classList.remove("active");
      linkLabelInput.value = "";
      linkUrlInput.value = "";
    });
    document.getElementById("cp-link-insert")!.addEventListener("click", () => {
      const label = linkLabelInput.value.trim();
      const url = linkUrlInput.value.trim();
      if (label && url) {
        insertAtCursor(`${label} (${url})`);
        linkDialog.classList.remove("active");
        linkLabelInput.value = "";
        linkUrlInput.value = "";
      }
    });

    // Phone button
    document.getElementById("cp-phone-btn")!.addEventListener("click", () => {
      insertAtCursor("📞 +998 ");
      textEl.focus();
    });

    // @mention button
    document.getElementById("cp-mention-btn")!.addEventListener("click", () => {
      insertAtCursor("@");
      textEl.focus();
    });

    // Template button
    document.getElementById("cp-template-btn")!.addEventListener("click", () => {
      const template = `Assalomu alaykum barchaga!!!

✈️ Avia CU_XXX reysimiz Toshkent omborimizda va tayyor holda.

📦 Yuklaringiz haqida batafsil ma'lumot:
🤖 Telegram bot: @activecargobot
🌐 Sayt: my.acargo.uz

🚚 Yetkazib berish:
👨🏻‍💻 @activecargo_yuk
📞 +998 99 809 90 48

🕒 Ish vaqtimiz:
Dushanba – Shanba | 09:00 – 18:00

Instagram (https://www.instagram.com/activecargo) | Telegram (https://t.me/activecargo) | Admin (https://t.me/activecargo_admin) | Telegram bot (https://t.me/ActiveCargoBot)`;
      textEl.value = template;
      textEl.focus();
    });

    // Live preview
    let previewVisible = false;
    document.getElementById("cp-preview-toggle")!.addEventListener("click", () => {
      previewVisible = !previewVisible;
      previewBox.classList.toggle("active", previewVisible);
      if (previewVisible) previewBox.innerHTML = this.linkify(textEl.value);
    });
    textEl.addEventListener("input", () => {
      if (previewVisible) previewBox.innerHTML = this.linkify(textEl.value);
    });

    // File handling
    const handleFile = (file: File) => {
      fileNameEl.textContent = file.name;
      fileSizeEl.textContent = `(${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      fileMedia.innerHTML = "";

      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        fileMedia.appendChild(img);
      } else if (file.type.startsWith("video/")) {
        const vid = document.createElement("video");
        vid.src = URL.createObjectURL(file);
        vid.controls = true;
        fileMedia.appendChild(vid);
      }

      dropZone.style.display = "none";
      filePreview.style.display = "block";
    };

    fileInput.addEventListener("change", () => {
      if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
    });

    // Drag & drop
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const file = e.dataTransfer?.files[0];
      if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        handleFile(file);
      }
    });

    // Remove file
    document.getElementById("cp-file-remove")!.addEventListener("click", () => {
      fileInput.value = "";
      fileMedia.innerHTML = "";
      dropZone.style.display = "";
      filePreview.style.display = "none";
    });
  }

  createPost() {
    const html = this.getPostFormHtml();

    swal.fire({
      title: "Yangi post yaratish",
      html,
      width: "min(620px, 95vw)",
      showCancelButton: true,
      confirmButtonText: "Joylash",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      didOpen: () => {
        const textEl = document.getElementById("cp-text") as HTMLTextAreaElement;
        this.setupPostFormEvents(textEl);
      },
      preConfirm: () => {
        const text = (document.getElementById("cp-text") as HTMLTextAreaElement).value.trim();
        const fileInput = document.getElementById("cp-file") as HTMLInputElement;
        const file = fileInput.files?.[0] || null;
        if (!text && !file) {
          swal.showValidationMessage("Matn yoki fayl kerak");
          return false;
        }
        return { text, file };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = new FormData();
        if (result.value.text) formData.append("text", result.value.text);
        if (result.value.file) formData.append("media", result.value.file);

        // Show loading spinner
        swal.fire({
          title: "Post joylanmoqda...",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => swal.showLoading(),
        });

        const headers = new HttpHeaders({ Authorization: localStorage.getItem("token") || "" });

        this.http.post<any>(`${GlobalVars.baseUrl}/channel-posts`, formData, { headers }).subscribe(
          (data) => {
            if (data.status === "ok") {
              this.loadPosts();
              swal.fire({ icon: "success", title: "Post joylandi!", timer: 1500, showConfirmButton: false });
            } else {
              swal.fire("Xatolik", data.error, "error");
            }
          },
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  editPost(post: any) {
    const html = this.getPostFormHtml(post.text || "");

    swal.fire({
      title: "Postni tahrirlash",
      html,
      width: "min(620px, 95vw)",
      showCancelButton: true,
      confirmButtonText: "Saqlash",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      didOpen: () => {
        const textEl = document.getElementById("cp-text") as HTMLTextAreaElement;
        this.setupPostFormEvents(textEl);
        // Hide file upload section when editing (text only)
        const fileField = document.querySelector(".cp-drop-zone")?.parentElement;
        if (fileField) fileField.style.display = "none";
      },
      preConfirm: () => {
        return (document.getElementById("cp-text") as HTMLTextAreaElement).value.trim();
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.put<any>(
          `${GlobalVars.baseUrl}/channel-posts/${post.id}`,
          { text: result.value },
          { headers: this.getHeaders() },
        ).subscribe(
          (data) => {
            if (data.status === "ok") {
              post.text = result.value;
              swal.fire({ icon: "success", title: "Saqlandi!", timer: 1200, showConfirmButton: false });
            }
          },
          () => swal.fire("Xatolik", "Saqlashda xatolik yuz berdi", "error"),
        );
      }
    });
  }

  deletePost(post: any) {
    swal.fire({
      title: "Postni o'chirish",
      text: "Rostdan ham bu postni o'chirmoqchimisiz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "O'chirish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete<any>(
          `${GlobalVars.baseUrl}/channel-posts/${post.id}`,
          { headers: this.getHeaders() },
        ).subscribe(
          () => {
            this.loadPosts();
            swal.fire({ icon: "success", title: "O'chirildi!", timer: 1200, showConfirmButton: false });
          },
          () => swal.fire("Xatolik", "O'chirishda xatolik yuz berdi", "error"),
        );
      }
    });
  }
}
