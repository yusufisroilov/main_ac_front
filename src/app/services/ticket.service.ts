import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { GlobalVars } from "../global-vars";

@Injectable({
  providedIn: "root",
})
export class TicketService {
  constructor(private http: HttpClient) {}
  private apiUrl = GlobalVars.baseUrl; // Change this to your API URL
  // Helper method to get headers with token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem("token");
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `${token}`,
    });
  }

  // ==========================================
  // CUSTOMER METHODS (ADDED - WERE MISSING!)
  // ==========================================

  /**
   * Create new ticket (Customer)
   * POST /api/tickets/create
   */
  createTicket(data: {
    subject: string;
    category?: string;
    priority?: string;
    message_text: string;
    related_consignment_id?: number;
    related_order_id?: number;
    related_finance_id?: number;
    attachments?: File[];
  }): Observable<any> {
    // If there are file attachments, use FormData
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append("subject", data.subject);
      formData.append("message_text", data.message_text);

      if (data.category) formData.append("category", data.category);
      if (data.priority) formData.append("priority", data.priority);
      if (data.related_consignment_id)
        formData.append(
          "related_consignment_id",
          data.related_consignment_id.toString()
        );
      if (data.related_order_id)
        formData.append("related_order_id", data.related_order_id.toString());
      if (data.related_finance_id)
        formData.append(
          "related_finance_id",
          data.related_finance_id.toString()
        );

      data.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const token = localStorage.getItem("token");
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      });

      return this.http.post(`${this.apiUrl}/tickets/create`, formData, {
        headers,
      });
    } else {
      // No attachments, use regular JSON
      return this.http.post(`${this.apiUrl}/tickets/create`, data, {
        headers: this.getHeaders(),
      });
    }
  }

  /**
   * Get customer's own tickets
   * GET /api/tickets/my-tickets
   */
  getMyTickets(params?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ""
        ) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/tickets/my-tickets`, {
      headers: this.getHeaders(),
      params: httpParams,
    });
  }

  /**
   * Get ticket detail (Customer view - no internal notes)
   * GET /api/tickets/:id
   */
  getTicketDetail(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Add customer reply to ticket
   * POST /api/tickets/:id/reply
   */
  addCustomerReply(
    id: string | number,
    data: {
      message_text: string;
      attachments?: File[];
    }
  ): Observable<any> {
    // If there are file attachments, use FormData
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append("message_text", data.message_text);

      data.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const token = localStorage.getItem("token");
      const headers = new HttpHeaders({
        Authorization: `${token}`,
      });

      return this.http.post(`${this.apiUrl}/tickets/${id}/reply`, formData, {
        headers,
      });
    } else {
      // No attachments, use regular JSON
      return this.http.post(`${this.apiUrl}/tickets/${id}/reply`, data, {
        headers: this.getHeaders(),
      });
    }
  }

  // ==========================================
  // ADMIN/STAFF METHODS
  // ==========================================

  /**
   * Get all tickets (admin view)
   * GET /api/tickets/admin/all
   */
  getAllTickets(filters?: any): Observable<any> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== null &&
          filters[key] !== undefined &&
          filters[key] !== ""
        ) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/tickets/admin/all`, {
      headers: this.getHeaders(),
      params: params,
    });
  }

  /**
   * Get ticket detail (admin view)
   * GET /api/tickets/admin/:id
   */
  getTicketDetailAdmin(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets/admin/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Staff replies to customer
   * POST /api/tickets/admin/:id/reply
   */
  addStaffReply(
    id: string | number,
    messageText: string,
    closeAfterReply: boolean = false
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/tickets/admin/${id}/reply`,
      {
        message_text: messageText,
        close_after_reply: closeAfterReply,
      },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Add internal note
   * POST /api/tickets/admin/:id/internal-note
   */
  addInternalNote(id: string | number, noteText: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/tickets/admin/${id}/internal-note`,
      { note_text: noteText },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update ticket status
   * PUT /api/tickets/admin/:id/status
   */
  updateTicketStatus(
    id: string | number,
    status: string,
    resolutionCode?: string
  ): Observable<any> {
    const body: any = { status };
    if (resolutionCode) {
      body.resolution_code = resolutionCode;
    }

    return this.http.put(`${this.apiUrl}/tickets/admin/${id}/status`, body, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Update ticket priority
   * PUT /api/tickets/admin/:id/priority
   */
  updateTicketPriority(id: string | number, priority: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/tickets/admin/${id}/priority`,
      { priority },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Reassign ticket
   * PUT /api/tickets/admin/:id/reassign
   */
  reassignTicket(
    id: string | number,
    assignedTo: string,
    assignedUserId?: number
  ): Observable<any> {
    const body: any = { assigned_to: assignedTo };
    if (assignedUserId) {
      body.assigned_user_id = assignedUserId;
    }

    return this.http.put(`${this.apiUrl}/tickets/admin/${id}/reassign`, body, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Get notification count
   * GET /api/tickets/admin/notifications/count
   */
  getNotificationCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets/admin/notifications/count`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Get ticket statistics
   * GET /api/tickets/admin/stats
   */
  getTicketStats(dateFrom?: string, dateTo?: string): Observable<any> {
    let params = new HttpParams();

    if (dateFrom) params = params.set("date_from", dateFrom);
    if (dateTo) params = params.set("date_to", dateTo);

    return this.http.get(`${this.apiUrl}/tickets/admin/stats`, {
      headers: this.getHeaders(),
      params: params,
    });
  }

  /**
   * Export tickets to Excel
   * GET /api/tickets/admin/export
   */
  exportTickets(filters?: any): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== null &&
          filters[key] !== undefined &&
          filters[key] !== ""
        ) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/tickets/admin/export`, {
      headers: this.getHeaders(),
      params: params,
      responseType: "blob",
    });
  }

  /**
   * Search tickets
   * GET /api/tickets/search
   */
  searchTickets(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Observable<any> {
    const params = new HttpParams()
      .set("q", query)
      .set("page", page.toString())
      .set("limit", limit.toString());

    return this.http.get(`${this.apiUrl}/tickets/search`, {
      headers: this.getHeaders(),
      params: params,
    });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  getStatusLabel(status: string): string {
    const labels: any = {
      unread: "Unread",
      open: "Open",
      answered: "Answered",
      "customer-reply": "Customer Reply",
      closed: "Closed",
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: any = {
      Low: "Low",
      Medium: "Medium",
      High: "High",
      Urgent: "Urgent",
    };
    return labels[priority] || priority;
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      unread: "badge-danger",
      open: "badge-info",
      answered: "badge-purple",
      "customer-reply": "badge-warning",
      closed: "badge-secondary",
    };
    return classes[status] || "badge-secondary";
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: any = {
      Low: "badge-success",
      Medium: "badge-info",
      High: "badge-warning",
      Urgent: "badge-danger",
    };
    return classes[priority] || "badge-secondary";
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
