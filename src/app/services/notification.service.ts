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
    console.log("🔔 Starting notification polling...");

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
    console.log("🔕 Stopping notification polling...");
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
      console.log("⚠️ No token found, skipping notification refresh");
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
    console.log("👔 Loading staff notifications...");

    Promise.all([
      // Get ticket counts
      this.http
        .get(`${this.baseUrl}/tickets/admin/notifications/count`, options)
        .toPromise(),
      // Get delivery counts
      this.http
        .get(`${this.baseUrl}/requests/admin/notifications/count`, options)
        .toPromise(),
      // Get ticket notification details (if you implement this endpoint later)
      // this.http.get(`${this.baseUrl}/tickets/admin/notifications`, options).toPromise()
    ])
      .then(([ticketCountRes, deliveryCountRes]) => {
        const ticketData = ticketCountRes.json();
        const deliveryData = deliveryCountRes.json();

        console.log("✅ Staff notifications loaded:", {
          tickets: ticketData.notifications?.total_needs_attention || 0,
          deliveries: deliveryData.notifications?.total_needs_attention || 0,
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

        // TODO: Update notification lists when staff detail endpoints are ready
        // For now, we'll use simple notifications based on counts
        this.createStaffNotificationPlaceholders(ticketData, deliveryData);
      })
      .catch((err) => {
        console.error("❌ Error fetching staff notifications:", err);
      });
  }

  /**
   * Load customer notifications
   */
  private loadCustomerNotifications(options: RequestOptions): void {
    console.log("👤 Loading customer notifications...");

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

          console.log("✅ Customer notifications loaded:", {
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
            ticketListData.notifications || []
          );

          // Update delivery notification list
          this.deliveryNotificationListSubject.next(
            deliveryListData.notifications || []
          );
        }
      )
      .catch((err) => {
        console.error("❌ Error fetching customer notifications:", err);
      });
  }

  /**
   * Create placeholder notifications for staff (until detail endpoints are implemented)
   */
  private createStaffNotificationPlaceholders(
    ticketData: any,
    deliveryData: any
  ): void {
    const ticketNotifications: NotificationItem[] = [];
    const deliveryNotifications: NotificationItem[] = [];

    // Create placeholder ticket notifications
    const unreadCount = ticketData.notifications?.unread || 0;
    const customerReplyCount = ticketData.notifications?.customer_reply || 0;

    if (unreadCount > 0) {
      ticketNotifications.push({
        id: "staff_unread",
        type: "staff_unread",
        title: `${unreadCount} New Ticket${unreadCount > 1 ? "s" : ""}`,
        description: "Click to view unread tickets",
        icon: "new_releases",
        color: "#f44336",
        timestamp: new Date(),
        isRead: false,
        actionUrl: "/uzm/tickets-list",
        relatedId: 0,
      });
    }

    if (customerReplyCount > 0) {
      ticketNotifications.push({
        id: "staff_customer_reply",
        type: "staff_customer_reply",
        title: `${customerReplyCount} Customer Repl${
          customerReplyCount > 1 ? "ies" : "y"
        }`,
        description: "Customers are waiting for your response",
        icon: "question_answer",
        color: "#ff9800",
        timestamp: new Date(),
        isRead: false,
        actionUrl: "/uzm/tickets-list",
        relatedId: 0,
      });
    }

    // Create placeholder delivery notifications
    const pendingCount = deliveryData.notifications?.pending || 0;
    const urgentCount = deliveryData.notifications?.urgent || 0;
    const paymentCount = deliveryData.notifications?.payment_pending || 0;

    if (pendingCount > 0) {
      deliveryNotifications.push({
        id: "staff_pending_delivery",
        type: "staff_pending_delivery",
        title: `${pendingCount} Pending Delivery Request${
          pendingCount > 1 ? "s" : ""
        }`,
        description: "Review and approve delivery requests",
        icon: "pending_actions",
        color: "#ff9800",
        timestamp: new Date(),
        isRead: false,
        actionUrl: "/uzm/admin-del-requests",
        relatedId: 0,
      });
    }

    if (urgentCount > 0) {
      deliveryNotifications.push({
        id: "staff_urgent_delivery",
        type: "staff_urgent_delivery",
        title: `${urgentCount} Urgent Delivery${
          urgentCount > 1 ? " Requests" : " Request"
        }`,
        description: "High priority deliveries need attention",
        icon: "priority_high",
        color: "#f44336",
        timestamp: new Date(),
        isRead: false,
        actionUrl: "/uzm/admin-del-requests",
        relatedId: 0,
      });
    }

    if (paymentCount > 0) {
      deliveryNotifications.push({
        id: "staff_payment_pending",
        type: "staff_payment_pending",
        title: `${paymentCount} Payment${
          paymentCount > 1 ? "s" : ""
        } to Verify`,
        description: "Customer payments need verification",
        icon: "payment",
        color: "#00bcd4",
        timestamp: new Date(),
        isRead: false,
        actionUrl: "/uzm/admin-del-requests",
        relatedId: 0,
      });
    }

    this.ticketNotificationListSubject.next(ticketNotifications);
    this.deliveryNotificationListSubject.next(deliveryNotifications);
  }

  /**
   * Get time ago string (e.g., "5m ago", "2h ago")
   */
  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Mark notification as read (future implementation)
   */
  markAsRead(notificationId: string): void {
    console.log("📖 Mark as read:", notificationId);
    // TODO: Implement API call to mark as read
    // For now, just refresh notifications
    this.refreshNotifications();
  }

  /**
   * Mark all notifications as read (future implementation)
   */
  markAllAsRead(): void {
    console.log("📖 Mark all as read");
    // TODO: Implement API call to mark all as read
    // For now, just refresh notifications
    this.refreshNotifications();
  }

  /**
   * Get current notification counts
   */
  getCurrentCounts(): NotificationCounts {
    return this.notificationCountSubject.value;
  }
}
