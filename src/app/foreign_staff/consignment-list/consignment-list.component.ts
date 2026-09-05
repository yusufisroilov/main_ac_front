import { GlobalVars } from "./../../global-vars";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from "@angular/core";
import { TableData } from "src/app/md/md-table/md-table.component";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers } from "@angular/http";

import swal from "sweetalert2";
import flatpickr from "flatpickr";

import { AuthService } from "src/app/pages/login/auth.service";

declare const $: any;

@Component({
  selector: "app-consignment-list",
  templateUrl: "./consignment-list.component.html",
  styleUrls: ["./consignment-list.component.css"],
})
export class ConsignmentListComponent implements OnInit {
  public tableData1: TableData;
  consignments: any[];
  options: any;
  showOnlyManagers: boolean;
  showOnlyManagers631: boolean = false;

  manifestData: any;
  totalWeight: string = "";
  totalPrice: string = "";
  consingmentName: string = "";
  activeConsignment = "";

  printContents;
  popupWin;

  printManifestCond: boolean;

  showOnlyForManagers: boolean = false;

  registredMessage: string;

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private changeDetectorRef: ChangeDetectorRef,
    public authService: AuthService,
  ) {
    if (
      localStorage.getItem("role") == "MANAGER" ||
      localStorage.getItem("role") == "ADMIN" ||
      localStorage.getItem("role") == "OWNER"
    ) {
      this.showOnlyForManagers = true;
    } else if (localStorage.getItem("role") == "UZBSTAFF") {
      this.showOnlyManagers631 = true;
    }

    let headers1 = new Headers({ "Content-Type": "application/json" });
    headers1.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: headers1 });
    this.printManifestCond = false;

    //this.activeConsignment = localStorage.getItem('current_party');
    this.activeConsignment = GlobalVars.currentParty;
  }

  ngOnInit() {
    this.http
      .get(GlobalVars.baseUrl + "/consignments/list", this.options)
      .subscribe((response) => {
        this.consignments = response.json().consignments;
      });

    this.tableData1 = {
      headerRow: [
        "Party number",
        "Open date",
        "Air waybill",
        "R Weight",
        "V Weight",
      ],
      dataRows: [["CU1001", "2021-01-17", "250-50798182", "158kg", "160kg"]],
    };
  }

  loadConsignments() {
    this.http
      .get(GlobalVars.baseUrl + "/consignments/list", this.options)
      .subscribe((response) => {
        this.consignments = response.json().consignments;
      });
  }

  editParty(conid: any) {
    swal
      .fire({
        title: "Change Consignment Details",
        html:
          '<div class="form-group">' +
          '<input  id="airWayBill" type="text" class="form-control m-2" placeholder="Air Waybill Number: " autofocus />' +
          '<div style="display:flex;"> <input  id="volumeWeight" type="text" class="form-control m-2" placeholder="Volume Weight: " />' +
          '<input  id="realWeight" type="text" class="form-control m-2" placeholder="Real Weight:" />' +
          " </div> </div>",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          var ele = $("input[id=input-trnum]").filter(":visible").focus();
        },
        preConfirm: (result) => {
          let airWayBill = $("#airWayBill").val();
          let volumeWeight = $("#volumeWeight").val();
          let realWeight = $("#realWeight ").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/edit?name=" +
                conid +
                "&volume=" +
                volumeWeight +
                "&mass=" +
                realWeight +
                "&airway_bill=" +
                airWayBill,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  this.registredMessage = response.json().message;
                  swal
                    .fire("Error happaned!", this.registredMessage, "error")
                    .then((result) => {});
                }

                this.http
                  .get(GlobalVars.baseUrl + "/consignments/list", this.options)
                  .subscribe((response) => {
                    this.consignments = response.json().consignments;
                  });
              },
              (error) => {
                if (error.status == 400) {
                  swal
                    .fire(
                      "Error happaned!",
                      "BAD REQUEST: WRONG TYPE OF INPUT",
                      "error",
                    )
                    .then((result) => {});
                }

                if (error.status == 401) {
                  this.authService.logout();
                }
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: "Changed!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  joinConsignments() {
    swal
      .fire({
        title: "Partiyalarni birlashtirish",
        text: "Partiya nomerlarini kiriting: 'CU540,CU541' yoki 'CN1,CN2' kabi. Iltimos extiyot bo'ling!",
        input: "text",
        confirmButtonText: "Saqlash",
        cancelButtonText: "No",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-info",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,

        preConfirm: (valueB) => {
          this.http
            .post(
              GlobalVars.baseUrl + "/consignments/merge?consignments=" + valueB,
              "",
              this.options,
            )
            .subscribe((response) => {
              swal.fire("O'zgartirildi", "", "success");
            });
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .get(GlobalVars.baseUrl + "/consignments/list", this.options)
            .subscribe((response) => {
              this.consignments = response.json().consignments;
            });
        }
      });
  }

  // These three endpoints are role-guarded on the backend, so they can no
  // longer be fetched with window.open — a raw browser tab cannot attach the
  // JWT from localStorage. Download as a blob through HttpClient (which does
  // send the Authorization header), then hand the file to the browser.
  private downloadConsignmentFile(
    endpoint: string,
    partyNum: any,
    fallbackName: string,
  ) {
    const url =
      GlobalVars.baseUrl + endpoint + "?consignment=" + encodeURIComponent(partyNum);

    this.httpClient
      .get(url, {
        headers: new HttpHeaders({
          Authorization: localStorage.getItem("token") || "",
        }),
        responseType: "blob",
        observe: "response",
      })
      .subscribe(
        (resp) => {
          const blob = resp.body as Blob;
          // Prefer the filename the server set; fall back to our own.
          const cd = resp.headers.get("content-disposition") || "";
          const match = cd.match(/filename=\"?([^\";]+)\"?/);
          const filename = (match && match[1]) || fallbackName;

          const objectUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = objectUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(objectUrl);
        },
        (error) => {
          if (error.status === 401) {
            this.authService.logout();
            return;
          }
          swal.fire(
            "Xatolik",
            error.status === 403
              ? "Sizda bu faylni yuklab olish huquqi yo'q"
              : "Faylni yuklab olishda xatolik",
            "error",
          );
        },
      );
  }

  takeSNK(partyNum: any) {
    this.downloadConsignmentFile(
      "/consignments/generate_snk",
      partyNum,
      `snk_${partyNum}.xlsx`,
    );
  }

  takePackingcList(partyNum: any) {
    this.downloadConsignmentFile(
      "/consignments/packing_list",
      partyNum,
      `packing_list_${partyNum}.xlsx`,
    );
  }

  receiversReport(partyNum: any) {
    // Backend route is /consignments/packing_list (generatePackingList).
    // The old /consignments/receiversReport URL was never defined → 404.
    this.downloadConsignmentFile(
      "/consignments/packing_list",
      partyNum,
      `packing_list_${partyNum}.xlsx`,
    );
  }

  takeManifestExcel(partyNum: any) {
    this.downloadConsignmentFile(
      "/consignments/manifest",
      partyNum,
      `manifest_${partyNum}.xlsx`,
    );
  }

  tranc(openDate) {
    let date = openDate as string;
    return date.substr(0, 16);
  }

  takeManifestData(consNum) {
    this.http
      .get(
        GlobalVars.baseUrl + "/consignments/manifest?consignment=" + consNum,
        this.options,
      )
      .subscribe(
        (response) => {
          this.manifestData = response.json().boxes;
          this.totalPrice = response.json().total_price;
          this.totalWeight = response.json().gross_weight;
          this.printManifestCond = true;
          this.consingmentName = consNum;
          this.changeDetectorRef.detectChanges();
          this.printContents =
            document.getElementById("print-section").innerHTML;
          this.popupWin = window.open(
            "",
            "_blank",
            "top=0,left=0,height=100%,width=auto",
          );
          this.popupWin.document.open();
          this.popupWin.document.write(`
          <html>
            <head>
              <title>Print tab</title>
              <style>
                body
                {
                  text-align: center;
                }

              </style>
            </head>
        <body onload="window.print(); window.close();"> ${this.printContents}
        
        </body>
          </html>`);

          //
          this.popupWin.document.close();
          this.printManifestCond = false;
        },
        (error) => {
          if (error.status == 401) {
            this.authService.logout();
          }
        },
      );
  }

  reOpenParty(consignmentName) {
    this.http
      .post(
        GlobalVars.baseUrl +
          "/consignments/reopen?consignment=" +
          consignmentName,
        "",
        this.options,
      )
      .subscribe(
        (response) => {
          if (response.json().status == "ok") {
            //localStorage.setItem("current_party", consignmentName);
            GlobalVars.currentParty = consignmentName;
            this.activeConsignment = GlobalVars.currentParty;

            this.http
              .get(GlobalVars.baseUrl + "/consignments/list", this.options)
              .subscribe((response) => {
                this.consignments = response.json().consignments;
              });
          } else {
            swal
              .fire("Error happaned!", response.json().message, "error")
              .then((result) => {});
          }
        },
        (error) => {
          if (error.status == 401) {
            this.authService.logout();
          }
        },
      );
  }

  reOpenFinance(consignmentName, rate) {
    swal
      .fire({
        title: "KURS KIRITING",
        allowEnterKey: true,
        html:
          '<div class="form-group">' +
          '<input id="input-rate" type="text" class="form-control m-2" placeholder="kurs" />' +
          "</div>",
        confirmButtonText: "KIRITISH",
        customClass: {
          confirmButton: "btn btn-info",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-rate").val(rate);
        },
        preConfirm: (valueB) => {
          let newRate = $("#input-rate").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/refinance?consignment=" +
                consignmentName +
                "&rate=" +
                newRate,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.http
                    .get(
                      GlobalVars.baseUrl + "/consignments/list",
                      this.options,
                    )
                    .subscribe((response) => {
                      this.consignments = response.json().consignments;
                      localStorage.setItem("current_party", consignmentName);
                    });
                } else {
                  swal
                    .fire("Error happaned!", response.json().message, "error")
                    .then((result) => {});
                }
              },
              (error) => {
                if (error.status == 401) {
                  this.authService.logout();
                }
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire("OMADLI!", "O'zgartirildi", "success");
        }
      });
  }

  makeHKparty(consignmentName, rate) {
    swal
      .fire({
        title: "BU reysni HONG KONG qimoqchimisiz?",
        allowEnterKey: true,
        html:
          '<div class="form-group">' +
          '<input id="input-rate" type="text" class="form-control m-2" placeholder="Tarif" />' +
          "</div>",
        confirmButtonText: "KIRITISH",
        customClass: {
          confirmButton: "btn btn-info",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-rate").val(rate);
        },
        preConfirm: (valueB) => {
          let newRate = $("#input-rate").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/makeHK?consignment=" +
                consignmentName +
                "&hongKongRate=" +
                newRate,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.http
                    .get(
                      GlobalVars.baseUrl + "/consignments/list",
                      this.options,
                    )
                    .subscribe((response) => {
                      this.consignments = response.json().consignments;
                    });
                } else {
                  swal
                    .fire("Error happaned!", response.json().message, "error")
                    .then((result) => {});
                }
              },
              (error) => {
                if (error.status == 401) {
                  this.authService.logout();
                }
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire("OMADLI!", "O'zgartirildi", "success");
        }
      });
  }

  undoHKparty(consignmentName) {
    swal
      .fire({
        title: "Bu HK Partiyani oddiy qilishni xoxlaysizmi?",
        showCancelButton: true,
        confirmButtonText: `Ha, oddiy`,
        denyButtonText: `NO`,
      })
      .then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/undoHK?consignment=" +
                consignmentName,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.http
                    .get(
                      GlobalVars.baseUrl + "/consignments/list",
                      this.options,
                    )
                    .subscribe((response) => {
                      swal.fire("O'zgardi!", "", "success");
                      this.consignments = response.json().consignments;
                    });
                } else {
                  swal
                    .fire("Error happaned!", response.json().message, "error")
                    .then((result) => {});
                }
              },
              (error) => {
                if (error.status == 401) {
                  this.authService.logout();
                }
              },
            );
        } else if (result.isDenied) {
          swal.fire("O'zgarmadi", "", "info");
        }
      });
  }

  changeStatusParty(consignmentName, status) {
    swal
      .fire({
        title: "Partiya   statusini o'zgartirishni hohlaysizmi?",
        showCancelButton: true,
        confirmButtonText: `Save`,
        denyButtonText: `Don't save`,
      })
      .then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/updateConsignment?consignment=" +
                consignmentName +
                "&status=" +
                status,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.http
                    .get(
                      GlobalVars.baseUrl + "/consignments/list",
                      this.options,
                    )
                    .subscribe((response) => {
                      swal.fire("O'zgardi!", "", "success");
                      this.consignments = response.json().consignments;
                    });
                } else {
                  swal
                    .fire("Error happaned!", response.json().message, "error")
                    .then((result) => {});
                }
              },
              (error) => {
                if (error.status == 401) {
                  this.authService.logout();
                }
              },
            );
        } else if (result.isDenied) {
          swal.fire("O'zgarmadi", "", "info");
        }
      });
  }

  printManifest(partyNum) {
    // console.log("c n " + partyNum);
    this.takeManifestData(partyNum);
  }

  journeyStatusLabels: { [key: number]: string } = {
    1: "Omborga kelmadi",
    2: "Xitoy omborida",
    3: "XA yo'lida",
    4: "Xitoy aeroportida",
    5: "UZB aeroportida",
    6: "Bojxonada",
    7: "Toshkent omborida",
    8: "Mijozga yuborildi",
    9: "Qabul qilindi",
    10: "Boshqa manzil",
  };

  journeyStatusColors: { [key: number]: string } = {
    1: "#9E9E9E",
    2: "#FF9800",
    3: "#03A9F4",
    4: "#2196F3",
    5: "#9C27B0",
    6: "#FF9800",
    7: "#388E3C",
    8: "#00BCD4",
    9: "#388E3C",
    10: "#607D8B",
  };

  getJourneyStatusLabel(status: number): string {
    return this.journeyStatusLabels[status] || "Noma'lum";
  }

  getJourneyStatusColor(status: number): string {
    return this.journeyStatusColors[status] || "#9E9E9E";
  }

  // ── Manager: edit consignment dates (Sanalarni tahrirlash) ──
  editConsignmentDates(consignment: any) {
    const isHongKong = !!consignment.isHongKong;
    // AVTO POCHTA identity now comes from the explicit flag / shipping_type;
    // legacy CN-warehouse rows (country_id=2 && hong_kong) still qualify.
    const isPochta =
      consignment.shipping_type === "AVTO POCHTA" ||
      !!consignment.is_avto_pochta ||
      (isHongKong && consignment.country_id === 2);
    const currentStatus = Number(consignment.journeyStatus) || 0;

    type Step = {
      id: string;
      key: string;
      label: string;
      icon: string;
      status: number;
    };

    // AVIA passes through UZ airport (status 5); AVTO/AVTO POCHTA go straight to
    // Bojxona (status 6) — different fields depending on shipping type.
    const fields: Step[] = isHongKong
      ? [
          { id: "ed-d2", key: "in_foreign_warehouse_date", label: "Xitoy ombor",    icon: "inventory_2",    status: 2 },
          { id: "ed-d4", key: "in_foreign_airport_date",   label: "Xitoy aeroport", icon: "local_shipping", status: 4 },
          { id: "ed-d6", key: "in_cpt_date",               label: "Bojxona",        icon: "assignment",     status: 6 },
          { id: "ed-d7", key: "in_uzb_warehouse_date",     label: "Toshkent ombor", icon: "warehouse",      status: 7 },
        ]
      : [
          { id: "ed-d2", key: "in_foreign_warehouse_date", label: "Xitoy ombor",    icon: "inventory_2",    status: 2 },
          { id: "ed-d4", key: "in_foreign_airport_date",   label: "Xitoy aeroport", icon: "flight_takeoff", status: 4 },
          { id: "ed-d5", key: "in_uzb_airport_date",       label: "O'zb. aeroport", icon: "flight_land",    status: 5 },
          { id: "ed-d7", key: "in_uzb_warehouse_date",     label: "Toshkent ombor", icon: "warehouse",      status: 7 },
        ];

    const statusOptions = isHongKong
      ? [
          { value: "1", label: "Kelmagan" },
          { value: "2", label: "Xitoy ombor" },
          { value: "4", label: "Xitoy aeroport" },
          { value: "6", label: "Bojxona" },
          { value: "7", label: "Toshkent ombor" },
        ]
      : [
          { value: "1", label: "Kelmagan" },
          { value: "2", label: "Xitoy ombor" },
          { value: "4", label: "Xitoy aeroport" },
          { value: "5", label: "O'zb. aeroport" },
          { value: "7", label: "Toshkent ombor" },
        ];

    const toIso = (d: any): string => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      return dt.toISOString().slice(0, 10);
    };

    const typeClass = isPochta ? "pochta" : isHongKong ? "avto" : "avia";
    const typeLabel = isPochta ? "AVTO POCHTA" : isHongKong ? "AVTO" : "AVIA";
    const currentStatusLabel =
      statusOptions.find((o) => o.value === String(currentStatus))?.label ||
      "Noma'lum";

    const stepRows = fields
      .map((f) => {
        const reached = currentStatus >= f.status;
        const isCurrent = currentStatus === f.status;
        const stateClass = isCurrent ? "is-current" : reached ? "is-done" : "";
        const nowTag = isCurrent ? `<span class="cl-now-tag">HOZIR</span>` : "";
        return `
          <div class="cl-step ${stateClass}">
            <div class="cl-step-icon"><i class="material-icons" style="font-size:18px;">${f.icon}</i></div>
            <div class="cl-step-body">
              <div class="cl-step-label">${f.label}${nowTag}</div>
              <input id="${f.id}" class="cl-step-input" type="text"
                     placeholder="kun.oy.yil" autocomplete="off"
                     data-iso="${toIso(consignment[f.key])}" />
            </div>
          </div>`;
      })
      .join("");

    const html = `
      <div class="cl-edit-meta">
        <span class="cl-type-pill ${typeClass}">${typeLabel}</span>
        <span>Hozir: <strong>${currentStatusLabel}</strong></span>
      </div>
      <p class="cl-dates-hint">
        <i class="material-icons" style="font-size:12px;vertical-align:middle;margin-right:3px;">info_outline</i>
        Bitta sana o'zgarsa, keyingilari avtomatik qayta hisoblanadi.
      </p>
      <div class="cl-timeline">${stepRows}</div>
      <div class="cl-status-row">
        <div class="cl-status-head">
          <label>Statusni o'zgartirish</label>
          <button type="button" id="ed-status-clear" class="cl-status-clear" hidden>
            <i class="material-icons" style="font-size:13px;">close</i>
            Tozalash
          </button>
        </div>
        <div class="cl-status-chips" id="ed-status-chips">
          ${statusOptions
            .map((o) => {
              const isCurrent = String(currentStatus) === o.value;
              return `
                <button type="button" class="cl-status-chip ${isCurrent ? "is-current" : ""}"
                        data-status="${o.value}">
                  <span class="cl-status-num">${o.value}</span>
                  <span>${o.label}</span>
                </button>`;
            })
            .join("")}
        </div>
        <input type="hidden" id="ed-status" value="" />
      </div>`;

    swal.fire({
      title: `${consignment.name} sanalari`,
      html,
      width: "min(420px, 95vw)",
      showCancelButton: true,
      confirmButtonText: "Saqlash",
      cancelButtonText: "Bekor",
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-secondary",
      },
      buttonsStyling: false,
      didOpen: () => {
        // Init flatpickr on each date input with the existing value pre-filled
        for (const f of fields) {
          const el = document.getElementById(f.id) as HTMLInputElement;
          if (!el) continue;
          const iso = el.dataset["iso"];
          flatpickr(el, {
            dateFormat: "d.m.Y",
            defaultDate: iso ? new Date(iso) : null,
            allowInput: true,
          });
        }

        // Status chips: click to select, click again to deselect.
        // Selected value is mirrored to the hidden #ed-status input.
        const chipsWrap = document.getElementById("ed-status-chips");
        const hidden = document.getElementById("ed-status") as HTMLInputElement;
        const clearBtn = document.getElementById("ed-status-clear") as HTMLButtonElement;

        const setSelection = (value: string) => {
          if (!chipsWrap) return;
          hidden.value = value;
          chipsWrap.querySelectorAll(".cl-status-chip").forEach((el) => {
            const v = (el as HTMLElement).dataset["status"];
            el.classList.toggle("is-selected", !!value && v === value);
          });
          if (clearBtn) clearBtn.hidden = !value;
        };

        chipsWrap?.querySelectorAll<HTMLButtonElement>(".cl-status-chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            const v = chip.dataset["status"] || "";
            setSelection(hidden.value === v ? "" : v);
          });
        });

        clearBtn?.addEventListener("click", () => setSelection(""));
      },
      preConfirm: () => {
        const payload: any = {};

        // Helper: parse "dd.mm.yyyy" → ISO yyyy-mm-dd, or null for empty
        const dmyToIso = (v: string): string | null => {
          if (!v || !v.trim()) return null;
          const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v.trim());
          if (!m) return undefined as any; // signal invalid
          return `${m[3]}-${m[2]}-${m[1]}`;
        };

        for (const f of fields) {
          const el = document.getElementById(f.id) as HTMLInputElement;
          const originalIso = el?.dataset["iso"] || "";
          const newRaw = el?.value || "";
          const newIso = dmyToIso(newRaw);

          if (newIso === undefined) {
            swal.showValidationMessage(`${f.label}: sana noto'g'ri formatda (kun.oy.yil)`);
            return false;
          }
          // Only include if value changed from the original
          if ((newIso || "") !== (originalIso || "")) {
            payload[f.key] = newIso; // null clears the column
          }
        }

        const statusEl = document.getElementById("ed-status") as HTMLInputElement;
        if (statusEl && statusEl.value !== "") {
          payload.status = parseInt(statusEl.value, 10);
        }

        if (Object.keys(payload).length === 0) {
          swal.showValidationMessage("Hech qanday o'zgarish kiritilmadi");
          return false;
        }
        return payload;
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;

      const url =
        GlobalVars.baseUrl +
        "/consignments/" +
        encodeURIComponent(consignment.name) +
        "/dates";

      // Use HttpClient for PUT (the legacy Http service doesn't expose .put cleanly here)
      const headers = new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token") || "",
      });

      this.httpClient.put<any>(url, result.value, { headers }).subscribe(
        (data) => {
          if (data && data.status === "ok") {
            swal.fire({
              icon: "success",
              title: "Saqlandi!",
              timer: 1500,
              showConfirmButton: false,
            });
            // Refresh list
            this.http
              .get(GlobalVars.baseUrl + "/consignments/list", this.options)
              .subscribe((response) => {
                this.consignments = response.json().consignments;
              });
          } else {
            swal.fire(
              "Xatolik",
              (data && (data.error || data.message)) || "Saqlashda xatolik",
              "error",
            );
          }
        },
        (error) => {
          if (error?.status === 401) {
            this.authService.logout();
            return;
          }
          swal.fire(
            "Xatolik",
            error?.error?.error || error?.message || "Saqlashda xatolik",
            "error",
          );
        },
      );
    });
  }
}
