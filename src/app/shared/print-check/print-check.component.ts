import {
  Component,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { Http, RequestOptions, Headers } from "@angular/http";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";

export interface PrintCheckData {
  customerId: string;
  consignmentName: string;
  quantity: string;
  weight: string;
  notes?: string;
}

// Backend response interface
interface BackendPrintData {
  idsChek: string;
  nameChek: string;
  counterChek: number;
  weightChek: number;
  izohChek: string;
}

@Component({
  selector: "app-print-check",
  templateUrl: "./print-check.component.html",
  styleUrls: ["./print-check.component.css"],
})
export class PrintCheckComponent {
  @ViewChild("printSection", { static: false }) printSection: ElementRef;

  // Data for printing
  @Input() data: PrintCheckData;

  // Control visibility of print section
  printCondition: boolean = false;

  // Http headers and options
  private headers: Headers;
  private options: RequestOptions;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private http: Http
  ) {
    this.headers = new Headers({ "Content-Type": "application/json" });
    this.headers.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers });
  }

  /**
   * Public method to trigger print
   * Call this method from parent component: this.printCheckComponent.print(deliveryId)
   * @param deliveryId - The delivery ID to fetch print data for
   */
  print(deliveryId: number) {
    if (!deliveryId) {
      swal.fire("Xatolik", "Delivery ID topilmadi", "error");
      return;
    }

    // Show loading state
    swal.fire({
      title: "Yuklanmoqda...",
      text: "Print ma'lumotlari yuklanmoqda",
      allowOutsideClick: false,
      didOpen: () => {
        swal.showLoading();
      },
    });

    // Fetch print data from backend
    this.http
      .get(
        GlobalVars.baseUrl + "/deliveries/print-data?delivery_id=" + deliveryId,
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();

          if (result.status === "ok" && result.data) {
            // Map backend response to PrintCheckData
            const backendData: BackendPrintData = result.data;
            this.data = {
              customerId: backendData.idsChek,
              consignmentName: backendData.nameChek,
              quantity: backendData.counterChek.toString(),
              weight: backendData.weightChek.toString(),
              notes: backendData.izohChek,
            };

            // Close loading and trigger print
            swal.close();
            this.executePrint();
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Print ma'lumotlarini yuklashda xatolik",
              "error"
            );
          }
        },
        (error) => {
          console.error("Error fetching print data:", error);
          swal.fire(
            "Xatolik",
            "Print ma'lumotlarini yuklashda xatolik",
            "error"
          );
        }
      );
  }

  /**
   * Execute the actual print operation
   * Private method called after data is loaded
   */
  private executePrint() {
    if (!this.data) {
      console.error("Print data is not available");
      return;
    }

    // Show the print section
    this.printCondition = true;

    // Detect changes to render the print section
    this.changeDetectorRef.detectChanges();

    // Get the print content
    const printContents = document.getElementById(
      "print-section-check"
    ).innerHTML;

    // Open new window for printing
    const popupWin = window.open(
      "",
      "_blank",
      "top=0,left=0,height=100%,width=auto"
    );

    popupWin.document.open();
    popupWin.document.write(`
      <html>
        <head>
          <title>Yuk Cheki</title>
          <style>
            body {
              text-align: center;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);

    popupWin.document.close();

    // Hide the print section
    this.printCondition = false;
  }
}
