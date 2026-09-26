import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import swal from "sweetalert2";
import { GlobalVars } from "src/app/global-vars";
import { showBackendError } from "src/app/shared/backend-error";

interface CargoTariff {
  id: number;
  country_id: number;
  type: string;
  min_weight: number;
  max_weight: number | null;
  rate_per_kg: number;
  is_active: boolean;
  country?: {
    id: number;
    name: string;
    name_ru: string;
  };
}

interface Country {
  id: number;
  name: string;
  name_ru: string | null;
  prefix: string | null;
  counter: number | null;
  company: string | null;
  company_street: string | null;
  company_index: string | null;
  lang_code: string | null;
  // Computed by GET /countries
  consignment_count?: number;
  numbering_locked?: boolean; // prefix + counter locked (country has consignments)
  tariff_count?: number;
  tariff_types?: string[];
  next_consignment_name?: string | null;
  // Resolved client-side once, so the template doesn't call a function per row
  lang_label?: string;
}

@Component({
  selector: "app-cargo-tariffs",
  standalone: false,
  templateUrl: "./cargo-tariffs.component.html",
  styleUrls: ["./cargo-tariffs.component.css"],
})
export class CargoTariffsComponent implements OnInit {
  tariffs: CargoTariff[] = [];
  countries: Country[] = [];
  isLoading: boolean = false;

  // Filter
  filterCountryId: string = "";
  filterType: string = "";

  // Form fields for add/edit
  isEditing: boolean = false;
  editingTariffId: number | null = null;
  formCountryId: number = 1;
  formType: string = "AVIA";
  formMinWeight: number = 0;
  formMaxWeight: number | null = null;
  formRatePerKg: number = 9.5;
  formIsUnlimited: boolean = false;

  // Tariff types
  tariffTypes: string[] = ["AVIA", "AVTO", "POTCHA"];

  // ─── Countries ─────────────────────────────────────────────────────────
  // The page is MANAGER/OWNER-only (ManagerOwnerAuthGuardService); this flag
  // is a second, cheap line of defence so edit controls never render for
  // anyone else.
  canManageCountries: boolean = ["MANAGER", "OWNER"].includes(
    localStorage.getItem("role") || "",
  );
  isLoadingCountries: boolean = false;
  isSavingCountry: boolean = false;
  isEditingCountry: boolean = false;
  editingCountry: Country | null = null;
  countryForm = this.emptyCountryForm();
  countryLangChoices: { code: string; label: string }[] = [];

  /** Product-name source languages offered for translation into Russian. */
  readonly langOptions: { code: string; label: string }[] = [
    { code: "zh", label: "Xitoy tili (zh)" },
    { code: "ko", label: "Koreys tili (ko)" },
    { code: "tr", label: "Turk tili (tr)" },
    { code: "en", label: "Ingliz tili (en)" },
    { code: "ja", label: "Yapon tili (ja)" },
    { code: "de", label: "Nemis tili (de)" },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCountries();
    this.loadTariffs();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  loadCountries() {
    this.isLoadingCountries = true;
    this.http
      .get<any>(`${GlobalVars.baseUrl}/countries`, {
        headers: this.getHeaders(),
      })
      .subscribe(
        (res) => {
          this.isLoadingCountries = false;
          const list: Country[] = res?.data?.countries || [];
          this.countries = list.map((c) => ({
            ...c,
            lang_label: this.langLabel(c.lang_code),
          }));
        },
        (err) => {
          this.isLoadingCountries = false;
          console.error("Error loading countries:", err);
          showBackendError(err, { fallback: "Mamlakatlarni yuklashda xatolik" });
        },
      );
  }

  loadTariffs() {
    this.isLoading = true;
    let url = `${GlobalVars.baseUrl}/api/tariffs`;

    // Add filters
    const params: string[] = [];
    if (this.filterCountryId) {
      params.push(`country_id=${this.filterCountryId}`);
    }
    if (this.filterType) {
      params.push(`type=${this.filterType}`);
    }
    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (res) => {
        this.isLoading = false;
        if (res.status === "success" && res.data) {
          this.tariffs = res.data.tariffs;
        }
      },
      (err) => {
        this.isLoading = false;
        console.error("Error loading tariffs:", err);
        swal.fire("Xatolik!", "Tariflarni yuklashda xatolik", "error");
      },
    );
  }

  applyFilter() {
    this.loadTariffs();
  }

  clearFilter() {
    this.filterCountryId = "";
    this.filterType = "";
    this.loadTariffs();
  }

  // Open add modal
  openAddModal() {
    this.isEditing = false;
    this.editingTariffId = null;
    this.resetForm();
    // @ts-ignore
    $("#tariffModal").modal("show");
  }

  // Open edit modal
  openEditModal(tariff: CargoTariff) {
    this.isEditing = true;
    this.editingTariffId = tariff.id;
    this.formCountryId = tariff.country_id;
    this.formType = tariff.type;
    this.formMinWeight = tariff.min_weight;
    this.formMaxWeight = tariff.max_weight;
    this.formRatePerKg = tariff.rate_per_kg;
    this.formIsUnlimited = tariff.max_weight === null;
    // @ts-ignore
    $("#tariffModal").modal("show");
  }

  resetForm() {
    this.formCountryId = 1;
    this.formType = "AVIA";
    this.formMinWeight = 0;
    this.formMaxWeight = null;
    this.formRatePerKg = 9.5;
    this.formIsUnlimited = false;
  }

  onUnlimitedChange() {
    if (this.formIsUnlimited) {
      this.formMaxWeight = null;
    }
  }

  saveTariff() {
    const payload = {
      country_id: this.formCountryId,
      type: this.formType,
      min_weight: this.formMinWeight,
      max_weight: this.formIsUnlimited ? null : this.formMaxWeight,
      rate_per_kg: this.formRatePerKg,
    };

    if (this.isEditing && this.editingTariffId) {
      // Update existing tariff
      this.http
        .put<any>(
          `${GlobalVars.baseUrl}/api/tariffs/${this.editingTariffId}`,
          payload,
          {
            headers: this.getHeaders(),
          },
        )
        .subscribe(
          (res) => {
            if (res.status === "success") {
              swal.fire("Muvaffaqiyat!", "Tarif yangilandi", "success");
              // @ts-ignore
              $("#tariffModal").modal("hide");
              this.loadTariffs();
            }
          },
          (err) => {
            console.error("Error updating tariff:", err);
            swal.fire(
              "Xatolik!",
              err.error?.message || "Tarifni yangilashda xatolik",
              "error",
            );
          },
        );
    } else {
      // Create new tariff
      this.http
        .post<any>(`${GlobalVars.baseUrl}/api/tariffs`, payload, {
          headers: this.getHeaders(),
        })
        .subscribe(
          (res) => {
            if (res.status === "success") {
              swal.fire("Muvaffaqiyat!", "Yangi tarif qo'shildi", "success");
              // @ts-ignore
              $("#tariffModal").modal("hide");
              this.loadTariffs();
            }
          },
          (err) => {
            console.error("Error creating tariff:", err);
            swal.fire(
              "Xatolik!",
              err.error?.message || "Tarif yaratishda xatolik",
              "error",
            );
          },
        );
    }
  }

  deleteTariff(tariff: CargoTariff) {
    swal
      .fire({
        title: "Tarifni o'chirish",
        text: `${tariff.type} (${tariff.min_weight}-${tariff.max_weight || "∞"} kg) tarifni o'chirishni xohlaysizmi?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ha, o'chirish",
        cancelButtonText: "Bekor qilish",
        confirmButtonColor: "#d33",
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .delete<any>(`${GlobalVars.baseUrl}/api/tariffs/${tariff.id}`, {
              headers: this.getHeaders(),
            })
            .subscribe(
              (res) => {
                if (res.status === "success") {
                  swal.fire("O'chirildi!", "Tarif o'chirildi", "success");
                  this.loadTariffs();
                }
              },
              (err) => {
                console.error("Error deleting tariff:", err);
                swal.fire("Xatolik!", "Tarifni o'chirishda xatolik", "error");
              },
            );
        }
      });
  }

  // ─── Country add / edit ────────────────────────────────────────────────

  private emptyCountryForm() {
    return {
      name: "",
      name_ru: "",
      prefix: "",
      counter: 0 as number | string,
      lang_code: "",
      company: "",
      company_street: "",
      company_index: "",
    };
  }

  /**
   * Prefix and counter are editable on create and while the country has no
   * consignments; both lock after the first one (also enforced server-side).
   */
  get numberingLocked(): boolean {
    return this.isEditingCountry && !!this.editingCountry?.numbering_locked;
  }

  /** Name the next consignment would get, previewed while creating a country. */
  get nextConsignmentPreview(): string {
    const counter = Number(this.countryForm.counter);
    const next = Number.isInteger(counter) && counter >= 0 ? counter + 1 : 1;
    return `${this.countryForm.prefix || "??"}${next}`;
  }

  langLabel(code: string | null | undefined): string {
    if (!code) return "Avto aniqlash";
    const opt = this.langOptions.find((o) => o.code === code);
    return opt ? opt.label : code;
  }

  /** Language dropdown, keeping a stored code that isn't in the standard list. */
  private buildLangChoices(current: string | null | undefined) {
    const choices = [...this.langOptions];
    if (current && !choices.some((o) => o.code === current)) {
      choices.unshift({ code: current, label: current });
    }
    return choices;
  }

  openAddCountryModal() {
    if (!this.canManageCountries) return;
    this.isEditingCountry = false;
    this.editingCountry = null;
    this.countryForm = this.emptyCountryForm();
    this.countryLangChoices = this.buildLangChoices(null);
    // @ts-ignore
    $("#countryModal").modal("show");
  }

  openEditCountryModal(country: Country) {
    if (!this.canManageCountries) return;
    this.isEditingCountry = true;
    this.editingCountry = country;
    this.countryForm = {
      name: country.name || "",
      name_ru: country.name_ru || "",
      prefix: country.prefix || "",
      counter: country.counter || 0,
      lang_code: country.lang_code || "",
      company: country.company || "",
      company_street: country.company_street || "",
      company_index: country.company_index || "",
    };
    this.countryLangChoices = this.buildLangChoices(country.lang_code);
    // @ts-ignore
    $("#countryModal").modal("show");
  }

  /** Uppercase Latin letters only, max 5 — normalised as the user types. */
  onPrefixInput(input: HTMLInputElement) {
    const value = (input.value || "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 5);
    input.value = value;
    this.countryForm.prefix = value;
  }

  saveCountry() {
    if (this.isSavingCountry || !this.canManageCountries) return;

    const f = this.countryForm;
    const name = (f.name || "").trim();
    if (!name) {
      swal.fire("Diqqat", "Mamlakat nomini kiriting", "warning");
      return;
    }

    const payload: any = {
      name,
      name_ru: f.name_ru,
      lang_code: f.lang_code || null,
      company: f.company,
      company_street: f.company_street,
      company_index: f.company_index,
    };

    // Locked prefix/counter aren't sent at all, so a legacy value that doesn't
    // match today's format can't block editing the other fields.
    if (!this.numberingLocked) {
      const prefix = (f.prefix || "").trim().toUpperCase();
      if (!/^[A-Z]{2,5}$/.test(prefix)) {
        swal.fire(
          "Diqqat",
          "Prefiks 2–5 ta lotin bosh harfidan iborat bo'lishi kerak (masalan, CU, KR)",
          "warning",
        );
        return;
      }
      payload.prefix = prefix;
    }

    // Counter is sent on create and while unlocked; never once consignments exist.
    if (!this.numberingLocked) {
      const counter = Number(f.counter);
      if (f.counter === "" || !Number.isInteger(counter) || counter < 0) {
        swal.fire("Diqqat", "Hisoblagich 0 yoki musbat butun son bo'lishi kerak", "warning");
        return;
      }
      payload.counter = counter;
    }

    const editingId =
      this.isEditingCountry && this.editingCountry ? this.editingCountry.id : null;
    const request = editingId
      ? this.http.put<any>(`${GlobalVars.baseUrl}/countries/${editingId}`, payload, {
          headers: this.getHeaders(),
        })
      : this.http.post<any>(`${GlobalVars.baseUrl}/countries`, payload, {
          headers: this.getHeaders(),
        });

    this.isSavingCountry = true;
    request.subscribe(
      () => {
        this.isSavingCountry = false;
        // @ts-ignore
        $("#countryModal").modal("hide");
        swal.fire(
          "Muvaffaqiyat!",
          editingId ? "Mamlakat yangilandi" : "Yangi mamlakat qo'shildi",
          "success",
        );
        this.loadCountries();
        // Tariff rows show the country name, so refresh them too.
        this.loadTariffs();
      },
      (err) => {
        this.isSavingCountry = false;
        showBackendError(err, { fallback: "Mamlakatni saqlashda xatolik" });
      },
    );
  }

  trackCountry(_index: number, country: Country): number {
    return country.id;
  }

  getCountryName(countryId: number): string {
    const country = this.countries.find((c) => c.id === countryId);
    return country ? country.name : `Country ${countryId}`;
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case "AVIA":
        return "badge-avia";
      case "AVTO":
        return "badge-avto";
      case "POTCHA":
        return "badge-potcha";
      default:
        return "badge-default";
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case "AVIA":
        return "flight";
      case "AVTO":
        return "local_shipping";
      case "POTCHA":
        return "inventory_2";
      default:
        return "category";
    }
  }

  formatWeight(minWeight: number, maxWeight: number | null): string {
    if (maxWeight === null) {
      return `${minWeight}+ kg`;
    }
    return `${minWeight} - ${maxWeight} kg`;
  }
}
