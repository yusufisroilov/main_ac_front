import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Subscription } from "rxjs/Subscription";

@Component({
  selector: "app-bottom-nav",
  templateUrl: "./bottom-nav.component.html",
  styleUrls: ["./bottom-nav.component.css"],
})
export class BottomNavComponent implements OnInit, OnDestroy {
  isClient = false;
  isMobile = false;
  activeRoute = "";
  showMoreMenu = false;
  private routerSub!: Subscription;

  navItems = [
    { path: "/customer-dashboard", icon: "home", label: "Asosiy" },
    { path: "/orders", icon: "shopping_cart", label: "Buyurtmalar" },
    { path: "/orderboxes", icon: "inventory_2", label: "Jo'natmalar" },
  ];

  moreItems = [
    { path: "/uzm/delivery-requests", icon: "local_shipping", label: "Yetkazish So'rovi" },
    { path: "/receivers", icon: "contacts", label: "Qabul qiluvchilar" },
    {
      path: "/customer-tickets",
      icon: "confirmation_number",
      label: "Murojaatlar",
    },
    { path: "/consignment-tracking", icon: "flight", label: "Reyslar Taqvimi" },
    { path: "/archive", icon: "archive", label: "Arxiv" },
    {
      path: "/uzm/video-lessons",
      icon: "play_circle_outline",
      label: "Video Darsliklar",
    },
    {
      path: "/pages/user",
      icon: "person",
      label: "Profil",
    },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.isClient = localStorage.getItem("role") === "CLIENT";
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile.bind(this));

    this.activeRoute = this.router.url;
    this.routerSub = this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        this.activeRoute = event.urlAfterRedirects || event.url;
        this.showMoreMenu = false;
      });
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    window.removeEventListener("resize", this.checkMobile.bind(this));
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 991;
  }

  isActive(path: string): boolean {
    return this.activeRoute === path;
  }

  isMoreActive(): boolean {
    return this.moreItems.some((item) => this.activeRoute === item.path);
  }

  navigate(path: string) {
    this.showMoreMenu = false;
    this.router.navigate([path]);
  }

  toggleMore() {
    this.showMoreMenu = !this.showMoreMenu;
  }

  closeMore() {
    this.showMoreMenu = false;
  }
}
