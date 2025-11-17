import { Component, Input } from "@angular/core";

interface Activity {
  id: number;
  action_type: string;
  action_description: string;
  performed_by: string;
  created_at: string;
}

@Component({
  selector: "app-activity-log",
  templateUrl: "./activity-log.component.html",
  styleUrls: ["./activity-log.component.css"],
})
export class ActivityLogComponent {
  @Input() activities: Activity[] = [];

  constructor() {}

  /**
   * Get icon for activity type
   */
  getActivityIcon(actionType: string): string {
    const iconMap: { [key: string]: string } = {
      created: "add_circle",
      status_changed: "swap_horiz",
      priority_changed: "flag",
      assigned: "person_add",
      reassigned: "sync_alt",
      customer_replied: "reply",
      staff_replied: "chat",
      internal_note_added: "note_add",
      closed: "check_circle",
      reopened: "lock_open",
    };

    return iconMap[actionType] || "info";
  }

  /**
   * Get color class for activity type
   */
  getActivityColor(actionType: string): string {
    const colorMap: { [key: string]: string } = {
      created: "activity-success",
      status_changed: "activity-info",
      priority_changed: "activity-warning",
      assigned: "activity-primary",
      reassigned: "activity-primary",
      customer_replied: "activity-customer",
      staff_replied: "activity-staff",
      internal_note_added: "activity-warning",
      closed: "activity-secondary",
      reopened: "activity-info",
    };

    return colorMap[actionType] || "activity-default";
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Get formatted action type label
   */
  getActionLabel(actionType: string): string {
    const labelMap: { [key: string]: string } = {
      created: "Created",
      status_changed: "Status Changed",
      priority_changed: "Priority Changed",
      assigned: "Assigned",
      reassigned: "Reassigned",
      customer_replied: "Customer Reply",
      staff_replied: "Staff Reply",
      internal_note_added: "Note Added",
      closed: "Closed",
      reopened: "Reopened",
    };

    return labelMap[actionType] || actionType;
  }
}
