import { GlobalVars, TypesOfOrder } from "src/app/global-vars";
import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { TableData } from "../md/md-table/md-table.component";
import { LegendItem, ChartType } from "../md/md-chart/md-chart.component";
import swal from "sweetalert2";

import * as Chartist from "chartist";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { Router } from "@angular/router";

declare const $: any;

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild("txtConfigFile") txtConfigFile: ElementRef;
  headers12: any;
  options: any;

  typeOfOrder: any[] = [];
  xitoyManzili: string;

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
  ) {
    this.typeOfOrder = [];

    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
    this.http
      .get(GlobalVars.baseUrl + "/order_types/list", this.options)
      .subscribe((response) => {
        this.typeOfOrder = response.json().order_types;
        GlobalVars.orderTypes = response.json().order_types;
      });

    // this.xitoyManzili = "易洋 C" + this.id + " 13560272583 " + "广州市白云区黄石街道江夏北中路12号强盛大厦F栋406 C" + this.id;
  }

  id = localStorage.getItem("id");
  username = localStorage.getItem("username");
  firstname = localStorage.getItem("first_name");
  lastname = localStorage.getItem("last_name");
  role = localStorage.getItem("role");

  public tableData: TableData;

  isManager(): boolean {
    return this.role === "MANAGER" || this.role === "UZBSTAFF";
  }

  goToCargoTariffs() {
    this.router.navigate(["/uzs/cargo-tariffs"]);
  }

  startAnimationForLineChart(chart: any) {
    let seq: any, delays: any, durations: any;
    seq = 0;
    delays = 80;
    durations = 500;
    chart.on("draw", function (data: any) {
      if (data.type === "line" || data.type === "area") {
        data.element.animate({
          d: {
            begin: 600,
            dur: 700,
            from: data.path
              .clone()
              .scale(1, 0)
              .translate(0, data.chartRect.height())
              .stringify(),
            to: data.path.clone().stringify(),
            easing: Chartist.Svg.Easing.easeOutQuint,
          },
        });
      } else if (data.type === "point") {
        seq++;
        data.element.animate({
          opacity: {
            begin: seq * delays,
            dur: durations,
            from: 0,
            to: 1,
            easing: "ease",
          },
        });
      }
    });

    seq = 0;
  }
  startAnimationForBarChart(chart: any) {
    let seq2: any, delays2: any, durations2: any;
    seq2 = 0;
    delays2 = 80;
    durations2 = 500;
    chart.on("draw", function (data: any) {
      if (data.type === "bar") {
        seq2++;
        data.element.animate({
          opacity: {
            begin: seq2 * delays2,
            dur: durations2,
            from: 0,
            to: 1,
            easing: "ease",
          },
        });
      }
    });

    seq2 = 0;
  }
  // constructor(private navbarTitleService: NavbarTitleService) { }
  public ngOnInit() {
    //   swal.fire({
    //     title: 'Manzilimiz o\'zgardi',

    //     buttonsStyling: false,
    //     customClass:{
    //       confirmButton: "btn btn-success",
    //     },
    //     html: '<b>Iltimos yangi manzildan foydalaning!</b> ' +
    //         '<b style="align: left;"> <br>国际仓C'+ this.id +' <br>18028594657<br> 广东省广州市白云区太和镇南村三姓南街43号1楼档口(原好客源超市)C'+this.id +'<br> 510440 </b><br>'
    // });

    this.tableData = {
      headerRow: ["ID", "Name", "Salary", "Country", "City"],
      dataRows: [
        ["US", "USA", "2.920	", "53.23%"],
        ["DE", "Germany", "1.300", "20.43%"],
        ["AU", "Australia", "760", "10.35%"],
        ["GB", "United Kingdom	", "690", "7.87%"],
        ["RO", "Romania", "600", "5.94%"],
        ["BR", "Brasil", "550", "4.34%"],
      ],
    };
    /* ----------==========     Daily Sales Chart initialization    ==========---------- */
    /*
      const dataDailySalesChart = {
          labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
          series: [
              [12, 17, 7, 17, 23, 18, 38]
          ]
      };

     const optionsDailySalesChart = {
          lineSmooth: Chartist.Interpolation.cardinal({
              tension: 0
          }),
          low: 0,
          high: 50, // creative tim: we recommend you to set the high sa the biggest value + something for a better look
          chartPadding: { top: 0, right: 0, bottom: 0, left: 0},
      };

      const dailySalesChart = new Chartist.Line('#dailySalesChart', dataDailySalesChart, optionsDailySalesChart);

      this.startAnimationForLineChart(dailySalesChart);
      */
    /* ----------==========     Completed Tasks Chart initialization    ==========---------- */
    /*
      const dataCompletedTasksChart = {
          labels: ['12p', '3p', '6p', '9p', '12p', '3a', '6a', '9a'],
          series: [
              [230, 750, 450, 300, 280, 240, 200, 190]
          ]
      };

      const optionsCompletedTasksChart = {
          lineSmooth: Chartist.Interpolation.cardinal({
              tension: 0
          }),
          low: 0,
          high: 1000, // creative tim: we recommend you to set the high sa the biggest value + something for a better
          // look
          chartPadding: { top: 0, right: 0, bottom: 0, left: 0}
      };

     const completedTasksChart = new Chartist.Line('#completedTasksChart', dataCompletedTasksChart,
      optionsCompletedTasksChart);

     this.startAnimationForLineChart(completedTasksChart);
*/
    /* ----------==========     Emails Subscription Chart initialization    ==========---------- */
    /*
      const dataWebsiteViewsChart = {
        labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
        series: [
          [542, 443, 320, 780, 553, 453, 326, 434, 568, 610, 756, 895]

        ]
      };
      const optionsWebsiteViewsChart = {
          axisX: {
              showGrid: false
          },
          low: 0,
          high: 1000,
          chartPadding: { top: 0, right: 5, bottom: 0, left: 0}
      };
      const responsiveOptions: any = [
        ['screen and (max-width: 640px)', {
          seriesBarDistance: 5,
          axisX: {
            labelInterpolationFnc: function (value) {
              return value[0];
            }
          }
        }]
      ];
      const websiteViewsChart = new Chartist.Bar('#websiteViewsChart', dataWebsiteViewsChart, optionsWebsiteViewsChart, responsiveOptions);

      this.startAnimationForBarChart(websiteViewsChart);

      $('#worldMap').vectorMap({
        map: 'world_en',
        backgroundColor: 'transparent',
         borderColor: '#818181',
         borderOpacity: 0.25,
         borderWidth: 1,
         color: '#b3b3b3',
         enableZoom: true,
         hoverColor: '#eee',
         hoverOpacity: null,
         normalizeFunction: 'linear',
         scaleColors: ['#b6d6ff', '#005ace'],
         selectedColor: '#c9dfaf',
         selectedRegions: null,
         showTooltip: true,
         onRegionClick: function(element, code, region)
         {
             var message = 'You clicked "'
                 + region
                 + '" which has the code: '
                 + code.toUpperCase();

             alert(message);
         }
      });
  
        */
  }

  copyToCB() {
    if (this.txtConfigFile) {
      // Select textarea text
      this.txtConfigFile.nativeElement.select();

      // Copy to the clipboard
      document.execCommand("copy");

      // Deselect selected textarea
      this.txtConfigFile.nativeElement.setSelectionRange(0, 0);
    }
  }

  ngAfterViewInit() {
    const breakCards = true;
    if (breakCards === true) {
      // We break the cards headers if there is too much stress on them :-)
      $('[data-header-animation="true"]').each(function () {
        const $fix_button = $(this);
        const $card = $(this).parent(".card");
        $card.find(".fix-broken-card").click(function () {
          const $header = $(this)
            .parent()
            .parent()
            .siblings(".card-header, .card-image");
          $header.removeClass("hinge").addClass("fadeInDown");

          $card.attr("data-count", 0);

          setTimeout(function () {
            $header.removeClass("fadeInDown animate");
          }, 480);
        });

        $card.mouseenter(function () {
          const $this = $(this);
          const hover_count = parseInt($this.attr("data-count"), 10) + 1 || 0;
          $this.attr("data-count", hover_count);
          if (hover_count >= 20) {
            $(this)
              .children(".card-header, .card-image")
              .addClass("hinge animated");
          }
        });
      });
    }
  }

  // Get finance totals by customer ID and date
  showFinanceTotals() {
    swal.fire({
      title: "Moliyaviy Ma'lumotlar",
      html:
        '<div class="form-group">' +
        '<label for="owner-id" style="display: block; text-align: left; margin-bottom: 5px; font-weight: 500;">Mijoz ID (Owner ID)</label>' +
        '<input id="owner-id" type="text" class="form-control swal2-input" placeholder="Masalan: 12345" style="margin: 0 0 15px 0;">' +
        '<label for="from-date" style="display: block; text-align: left; margin-bottom: 5px; font-weight: 500;">Boshlanish Sanasi</label>' +
        '<input id="from-date" type="date" class="form-control swal2-input" style="margin: 0;">' +
        "</div>",
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Qidirish",
      cancelButtonText: "Bekor qilish",
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-secondary",
      },
      buttonsStyling: false,
      preConfirm: () => {
        const ownerId = (<HTMLInputElement>document.getElementById("owner-id"))
          .value;
        const fromDate = (<HTMLInputElement>(
          document.getElementById("from-date")
        )).value;

        if (!ownerId || !fromDate) {
          swal.showValidationMessage("Iltimos barcha maydonlarni to'ldiring");
          return false;
        }

        // Show loading
        swal.fire({
          title: "Yuklanmoqda...",
          text: "Ma'lumotlar yuklanmoqda",
          allowOutsideClick: false,
          didOpen: () => {
            swal.showLoading();
          },
        });

        // Make the API request
        this.http
          .get(
            GlobalVars.baseUrl +
              `/finance/totals-by-date?owner_id=${ownerId}&fromDate=${fromDate}`,
            this.options,
          )
          .subscribe(
            (response) => {
              const result = response.json();

              if (result.status === "ok") {
                // Display the results in a modern, professional way
                swal.fire({
                  title:
                    '<strong style="font-size: 18px;">Moliyaviy Hisobot</strong>',
                  icon: "success",
                  html:
                    '<div style="text-align: left; padding: 10px;">' +
                    '<div style="background: #f8f9fa; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px;">' +
                    '<p style="margin: 3px 0; color: #666; font-size: 12px;"><i class="material-icons" style="vertical-align: middle; font-size: 14px;">person</i> <strong>ID:</strong> <span style="color: #333; font-weight: 600;">' +
                    ownerId +
                    "</span></p>" +
                    '<p style="margin: 3px 0; color: #666; font-size: 12px;"><i class="material-icons" style="vertical-align: middle; font-size: 14px;">calendar_today</i> <strong>Sana:</strong> <span style="color: #333;">' +
                    fromDate +
                    "</span> dan</p>" +
                    "</div>" +
                    '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px; border-radius: 6px; color: white; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">' +
                    '<p style="margin: 0 0 5px 0; font-size: 11px; opacity: 0.9;">Jami Og\'irlik</p>' +
                    '<h3 style="margin: 0; font-size: 22px; font-weight: 700;">' +
                    result.total_weight +
                    ' <span style="font-size: 14px;">kg</span></h3>' +
                    "</div>" +
                    '<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 12px; border-radius: 6px; color: white; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">' +
                    '<p style="margin: 0 0 5px 0; font-size: 11px; opacity: 0.9;">Jami Summa</p>' +
                    '<h3 style="margin: 0; font-size: 22px; font-weight: 700;">$' +
                    result.total_sum_usd +
                    "</h3>" +
                    "</div>" +
                    '<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 12px; border-radius: 6px; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">' +
                    '<p style="margin: 0 0 5px 0; font-size: 11px; opacity: 0.9;">Yozuvlar Soni</p>' +
                    '<h3 style="margin: 0; font-size: 22px; font-weight: 700;">' +
                    result.count +
                    "</h3>" +
                    "</div>" +
                    "</div>",
                  showConfirmButton: true,
                  confirmButtonText: "Yopish",
                  customClass: {
                    confirmButton: "btn btn-primary",
                  },
                  buttonsStyling: false,
                  width: "400px",
                });
              } else {
                swal.fire({
                  icon: "info",
                  title: "Ma'lumot topilmadi",
                  text:
                    result.message ||
                    "Berilgan ma'lumotlar bo'yicha yozuvlar topilmadi",
                  confirmButtonText: "OK",
                  customClass: {
                    confirmButton: "btn btn-primary",
                  },
                  buttonsStyling: false,
                });
              }
            },
            (error) => {
              console.error("Error fetching finance totals:", error);
              swal.fire({
                icon: "error",
                title: "Xatolik",
                text: "Ma'lumotlarni yuklashda xatolik yuz berdi",
                confirmButtonText: "OK",
                customClass: {
                  confirmButton: "btn btn-danger",
                },
                buttonsStyling: false,
              });
            },
          );

        return false; // Prevent the popup from closing
      },
    });
  }
}
