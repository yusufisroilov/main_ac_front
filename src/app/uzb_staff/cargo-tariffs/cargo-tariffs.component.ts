import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import swal from "sweetalert2";
import { GlobalVars } from "src/app/global-vars";

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
  name_ru: string;
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
    // Load countries from existing endpoint
    this.http
      .get<any>(`${GlobalVars.baseUrl}/consignments/countries`, {
        headers: this.getHeaders(),
      })
      .subscribe(
        (res) => {
          if (res.data && res.data.countries) {
            this.countries = res.data.countries;
          }
        },
        (err) => {
          console.error("Error loading countries:", err);
        }
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
      }
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
        .put<any>(`${GlobalVars.baseUrl}/api/tariffs/${this.editingTariffId}`, payload, {
          headers: this.getHeaders(),
        })
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
            swal.fire("Xatolik!", err.error?.message || "Tarifni yangilashda xatolik", "error");
          }
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
            swal.fire("Xatolik!", err.error?.message || "Tarif yaratishda xatolik", "error");
          }
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
              }
            );
        }
      });
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
