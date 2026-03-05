import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "src/app/pages/login/auth.service";
import { AuditPaymentsBase } from "../audit-payments-base";

@Component({
  selector: "app-audit-pending",
  templateUrl: "./pending-payments.component.html",
  styleUrls: ["./pending-payments.component.css"],
})
export class AuditPendingComponent extends AuditPaymentsBase implements OnInit {
  auditStatus = "PENDING";
  statusLabel = "Kutilayotgan";

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  ngOnInit() { this.init(); }
}
