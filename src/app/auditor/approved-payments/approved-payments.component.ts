import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "src/app/pages/login/auth.service";
import { AuditPaymentsBase } from "../audit-payments-base";

@Component({
  selector: "app-audit-approved",
  templateUrl: "./approved-payments.component.html",
  styleUrls: ["./approved-payments.component.css"],
})
export class AuditApprovedComponent extends AuditPaymentsBase implements OnInit {
  auditStatus = "APPROVED";
  statusLabel = "Tasdiqlangan";

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  ngOnInit() { this.init(); }
}
