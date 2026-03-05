import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "src/app/pages/login/auth.service";
import { AuditPaymentsBase } from "../audit-payments-base";

@Component({
  selector: "app-audit-rejected",
  templateUrl: "./rejected-payments.component.html",
  styleUrls: ["./rejected-payments.component.css"],
})
export class AuditRejectedComponent extends AuditPaymentsBase implements OnInit {
  auditStatus = "REJECTED";
  statusLabel = "Rad etilgan";

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  ngOnInit() { this.init(); }
}
