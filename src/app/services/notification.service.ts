import { Injectable } from "@angular/core";
import { Http, RequestOptions, Headers } from "@angular/http";
import { BehaviorSubject, interval, Subscription } from "rxjs";
import { GlobalVars } from "../global-vars";

/**
 * Interface for notification counts (badge numbers)
 */
export interface NotificationCounts {
  tickets: number;
  deliveryRequests: number;
  total: number;
}

/**
 * Interface for individual notification details (dropdown items)
 */
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl: string;
  relatedId: number;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  // Observable for badge counts
  private notificationCountSubject = new BehaviorSubject<NotificationCounts>({
    tickets: 0,
    deliveryRequests: 0,
    total: 0,
  });

  // Observable for ticket notification details
  private ticketNotificationListSubject = new BehaviorSubject<
    NotificationItem[]
  >([]);

  // Observable for delivery notification details
  private deliveryNotificationListSubject = new BehaviorSubject<
    NotificationItem[]
  >([]);

  // Public observables that components can subscribe to
  public notificationCounts$ = this.notificationCountSubject.asObservable();
  public ticketNotifications$ =
    this.ticketNotificationListSubject.asObservable();
  public deliveryNotifications$ =
    this.deliveryNotificationListSubject.asObservable();

  private pollingInterval: Subscription;
  private baseUrl = GlobalVars.baseUrl;

  constructor(private http: Http) {}

  /**
   * Start polling for notifications every 30 seconds
   */
  startPolling(): void {
    // console.log("🔔 Bildirnomalarga obuna boshlandi...");

    // Initial load
    this.refreshNotifications();

    // Poll every 30 seconds
    this.pollingInterval = interval(30000).subscribe(() => {
      this.refreshNotifications();
    });
  }

  /**
   * Stop polling (call on logout)
   */
  stopPolling(): void {
    // console.log("🔕 Bildirnomalarga obuna to'xtatildi...");
    if (this.pollingInterval) {
      this.pollingInterval.unsubscribe();
    }
  }

  /**
   * Refresh all notifications (counts + details)
   */
  refreshNotifications(): void {
    const token = localStorage.getItem("token");
    if (!token) {
      // console.log("⚠️ Token topilmadi, bildirnomalari yangilanmadi");
      return;
    }

    const headers = new Headers({
      Authorization: token,
      "Content-Type": "application/json",
    });
    const options = new RequestOptions({ headers });

    const role = localStorage.getItem("role");
    const isStaff = [
      "MANAGER",
      "CHINASTAFF",
      "YUKCHI",
      "DELIVERER",
      "ACCOUNTANT",
      "ADMIN",
    ].includes(role);

    if (isStaff) {
      this.loadStaffNotifications(options);
    } else {
      this.loadCustomerNotifications(options);
    }
  }

  /**
   * Load staff notifications (Manager, staff members)
   */
  private loadStaffNotifications(options: RequestOptions): void {
    // console.log("👔 Xodim bildirnomalari yuklanmoqda...");

    Promise.all([
      // Get ticket counts
      this.http
        .get(`${this.baseUrl}/tickets/admin/notifications/count`, options)
        .toPromise(),
      // Get delivery counts
      this.http
        .get(`${this.baseUrl}/requests/admin/notifications/count`, options)
        .toPromise(),
      // Get ticket notification details
      this.http
        .get(`${this.baseUrl}/tickets/admin/notifications`, options)
        .toPromise(),
      // Get delivery notification details
      this.http
        .get(`${this.baseUrl}/requests/admin/notifications`, options)
        .toPromise(),
    ])
      .then(
        ([
          ticketCountRes,
          deliveryCountRes,
          ticketListRes,
          deliveryListRes,
        ]) => {
          const ticketData = ticketCountRes.json();
          const deliveryData = deliveryCountRes.json();
          const ticketListData = ticketListRes.json();
          const deliveryListData = deliveryListRes.json();

          console.log("✅ Xodim bildirnomalari yuklandi:", {
            tickets: ticketData.notifications?.total_needs_attention || 0,
            deliveries: deliveryData.notifications?.total_needs_attention || 0,
            ticketDetails: ticketListData.notifications?.length || 0,
            deliveryDetails: deliveryListData.notifications?.length || 0,
          });

          // Update counts
          this.notificationCountSubject.next({
            tickets: ticketData.notifications?.total_needs_attention || 0,
            deliveryRequests:
              deliveryData.notifications?.total_needs_attention || 0,
            total:
              (ticketData.notifications?.total_needs_attention || 0) +
              (deliveryData.notifications?.total_needs_attention || 0),
          });

          // Update ticket notification list
          this.ticketNotificationListSubject.next(
            ticketListData.notifications || [],
          );

          // Update delivery notification list
          this.deliveryNotificationListSubject.next(
            deliveryListData.notifications || [],
          );
        },
      )
      .catch((err) => {
        console.error("❌ Xodim bildirnomalari yuklashda xatolik:", err);
      });
  }

  /**
   * Load customer notifications
   */
  private loadCustomerNotifications(options: RequestOptions): void {
    // console.log("👤 Mijoz bildirnomalari yuklanmoqda...");

    Promise.all([
      // Get ticket counts
      this.http
        .get(`${this.baseUrl}/tickets/customer/notifications/count`, options)
        .toPromise(),
      // Get delivery counts
      this.http
        .get(`${this.baseUrl}/requests/customer/notifications/count`, options)
        .toPromise(),
      // Get ticket notification details
      this.http
        .get(`${this.baseUrl}/tickets/customer/notifications`, options)
        .toPromise(),
      // Get delivery notification details
      this.http
        .get(`${this.baseUrl}/requests/customer/notifications`, options)
        .toPromise(),
    ])
      .then(
        ([
          ticketCountRes,
          deliveryCountRes,
          ticketListRes,
          deliveryListRes,
        ]) => {
          const ticketData = ticketCountRes.json();
          const deliveryData = deliveryCountRes.json();
          const ticketListData = ticketListRes.json();
          const deliveryListData = deliveryListRes.json();

          console.log("✅ Mijoz bildirnomalari yuklandi:", {
            tickets: ticketData.notifications?.total_needs_attention || 0,
            deliveries: deliveryData.notifications?.total_needs_attention || 0,
            ticketDetails: ticketListData.notifications?.length || 0,
            deliveryDetails: deliveryListData.notifications?.length || 0,
          });

          // Update counts
          this.notificationCountSubject.next({
            tickets: ticketData.notifications?.total_needs_attention || 0,
            deliveryRequests:
              deliveryData.notifications?.total_needs_attention || 0,
            total:
              (ticketData.notifications?.total_needs_attention || 0) +
              (deliveryData.notifications?.total_needs_attention || 0),
          });

          // Update ticket notification list
          this.ticketNotificationListSubject.next(
            ticketListData.notifications || [],
          );

          // Update delivery notification list
          this.deliveryNotificationListSubject.next(
            deliveryListData.notifications || [],
          );
        },
      )
      .catch((err) => {
        console.error("❌ Mijoz bildirnomalari yuklashda xatolik:", err);
      });
  }

  /**
   * Get time ago string (e.g., "5 daqiqa oldin", "2 soat oldin")
   */
  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Hozirgina";
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    if (days < 7) return `${days} kun oldin`;
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Mark a single ticket notification as read
   * @param ticketId - The ticket ID or ticket_number
   */
  markAsRead(ticketId: string): void {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = new Headers({
      Authorization: token,
      "Content-Type": "application/json",
    });
    const options = new RequestOptions({ headers });

    this.http
      .put(`${this.baseUrl}/tickets/${ticketId}/mark-read`, {}, options)
      .toPromise()
      .then((res) => {
        console.log("📖 Ticket marked as read:", ticketId);
        this.refreshNotifications();
      })
      .catch((err) => {
        console.error("❌ Error marking ticket as read:", err);
      });
  }

  /**
   * Mark all ticket notifications as read
   */
  markAllTicketsAsRead(): void {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = new Headers({
      Authorization: token,
      "Content-Type": "application/json",
    });
    const options = new RequestOptions({ headers });

    this.http
      .put(`${this.baseUrl}/tickets/mark-all-read`, {}, options)
      .toPromise()
      .then((res) => {
        console.log("📖 All tickets marked as read");
        this.refreshNotifications();
      })
      .catch((err) => {
        console.error("❌ Error marking all tickets as read:", err);
      });
  }

  /**
   * @deprecated Use markAllTicketsAsRead() instead
   */
  markAllAsRead(): void {
    this.markAllTicketsAsRead();
  }

  /**
   * Mark all delivery notifications as read
   * Note: Delivery notifications are status-based (pending, approved, etc.)
   * This clears the local list - changes persist when request status changes
   */
  markAllDeliveriesAsRead(): void {
    // Clear local delivery notification list
    this.deliveryNotificationListSubject.next([]);
    // Update counts
    const currentCounts = this.notificationCountSubject.value;
    this.notificationCountSubject.next({
      ...currentCounts,
      deliveryRequests: 0,
      total: currentCounts.tickets,
    });
    console.log("📖 Delivery notifications cleared locally");
  }

  /**
   * Get current notification counts
   */
  getCurrentCounts(): NotificationCounts {
    return this.notificationCountSubject.value;
  }
}
