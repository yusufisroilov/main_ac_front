import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "src/app/pages/login/auth.service";
import { AuditPaymentsBase } from "../audit-payments-base";

@Component({
  selector: "app-audit-suspicious",
  templateUrl: "./suspicious-payments.component.html",
  styleUrls: ["./suspicious-payments.component.css"],
})
export class AuditSuspiciousComponent extends AuditPaymentsBase implements OnInit {
  auditStatus = "SUSPICIOUS";
  statusLabel = "Shubhali";

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  ngOnInit() { this.init(); }
}
