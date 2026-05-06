import { formatDate } from "@angular/common";
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "tzDate" })
export class TzDatePipe implements PipeTransform {
  transform(value: any, format: string = "dd.MM.yyyy HH:mm"): string {
    if (!value) return "";
    let v = value;
    // Backend returns timestamps without a timezone marker
    // (e.g. "2026-05-06 06:45:00" or "2026-05-06T06:45:00.000").
    // Treat them as UTC so the +0500 shift produces Tashkent wall-clock time.
    if (typeof v === "string" && !/Z|[+-]\d{2}:?\d{2}$/.test(v)) {
      v = v.replace(" ", "T") + "Z";
    }
    return formatDate(v, format, "en-US", "+0500");
  }
}
