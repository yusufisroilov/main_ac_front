import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-info-page",
  templateUrl: "./info-page.component.html",
  styleUrls: ["./info-page.component.css"],
})
export class InfoPageComponent implements OnInit {
  activeSection = "tariflar";
  customerId = localStorage.getItem("id") || "";
  addressMode: "avia" | "avto" | "avto_pochta" = "avia";

  sections = [
    { id: "tariflar", label: "Tariflar", icon: "price_change" },
    { id: "manzil", label: "Manzil", icon: "location_on" },
    { id: "eslatma", label: "Eslatma", icon: "notifications" },
    { id: "ishlashi", label: "Ishlashi", icon: "info_outline" },
    { id: "kontaktlar", label: "Kontaktlar", icon: "contacts" },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const section = params["section"] || "tariflar";
      this.activeSection = section;
      setTimeout(() => this.scrollTo(section), 100);
    });
  }

  scrollTo(sectionId: string) {
    this.activeSection = sectionId;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  goBack() {
    this.router.navigate(["/customer-dashboard"]);
  }

  getAviaAddress(): string {
    return `易洋K${this.customerId}\n18028594657\n广州市白云区太和镇龙归南村三姓南街43号1楼原好客源超市K${this.customerId}`;
  }

  getAvtoAddress(): string {
    return `陆运W${this.customerId}\n18028594657\n广东省广州市白云区龙归街道南村三姓南街43号1楼原好客源超市 陆运W${this.customerId}`;
  }

  getAvtoPochtaAddress(): string {
    return `小陆AP${this.customerId}\n18529547697\n广东省深圳市宝安区福永街道怀德南路199号锦城大厦5008 AP${this.customerId}`;
  }

  copyAddress() {
    let text: string;
    if (this.addressMode === "avia") {
      text = this.getAviaAddress();
    } else if (this.addressMode === "avto") {
      text = this.getAvtoAddress();
    } else {
      text = this.getAvtoPochtaAddress();
    }
    navigator.clipboard.writeText(text).then(() => {
      this.copiedAddress = true;
      setTimeout(() => (this.copiedAddress = false), 2000);
    });
  }

  copiedAddress = false;
}
