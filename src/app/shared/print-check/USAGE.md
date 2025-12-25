# PrintCheckComponent Usage Guide

## Overview
This is a reusable component for printing delivery checks. It automatically fetches delivery data from the backend and prints it.

## Features
- ✅ Reusable across multiple components
- ✅ Automatically fetches data from backend API
- ✅ Shows loading state while fetching data
- ✅ Automatically triggers browser print dialog
- ✅ Closes automatically after printing
- ✅ Simple API - just pass delivery ID

## How It Works

1. Parent component calls `printCheckComponent.print(deliveryId)`
2. Component shows loading dialog
3. Component fetches print data from `/deliveries/print-data?delivery_id=X`
4. Backend processes the delivery and returns formatted data
5. Component triggers browser print dialog
6. Print dialog shows formatted check

## How to Use

### Step 1: Import SharedModule in your module

```typescript
// Example: In uzb-staff.module.ts
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,  // Add this
    // ... other imports
  ],
  declarations: [
    // ... your components
  ],
})
export class UzbStaffModule {}
```

### Step 2: Add the component to your template

```html
<!-- In your component HTML (e.g., pickup-deliveries.component.html) -->

<!-- Add the print component at the bottom (hidden by default) -->
<app-print-check #printCheck></app-print-check>

<!-- Add a button to trigger print -->
<button class="btn btn-primary" (click)="printDeliveryCheck(delivery)">
  <i class="material-icons">print</i>
  Chek
</button>
```

### Step 3: Set up your component TypeScript

```typescript
// In your component .ts file (e.g., pickup-deliveries.component.ts)
import { Component, ViewChild } from '@angular/core';
import { PrintCheckComponent } from '../../shared/print-check/print-check.component';

export class YourComponent {
  @ViewChild('printCheck') printCheckComponent: PrintCheckComponent;

  // Method to print check - just pass delivery.id!
  printDeliveryCheck(delivery: any) {
    this.printCheckComponent.print(delivery.id);
  }
}
```

## Complete Example

### Example: Using in PickupDeliveriesComponent

**pickup-deliveries.component.html:**
```html
<div class="card">
  <div class="card-body">
    <table class="table">
      <tbody>
        <tr *ngFor="let delivery of deliveries">
          <td>{{ delivery.barcode }}</td>
          <td>{{ delivery.weight }} kg</td>
          <td>
            <!-- View button -->
            <button class="btn btn-sm btn-info mr-1" (click)="viewDeliveryDetails(delivery)">
              <i class="material-icons">visibility</i>
              Ko'rish
            </button>

            <!-- Berdim button -->
            <button *ngIf="canProcessDelivery(delivery)"
                    class="btn btn-sm btn-primary mr-1"
                    (click)="processDelivery(delivery)">
              <i class="material-icons">send</i>
              Berdim
            </button>

            <!-- Print Check button -->
            <button class="btn btn-sm btn-success" (click)="printDeliveryCheck(delivery)">
              <i class="material-icons">print</i>
              Chek
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Print Component (hidden) -->
<app-print-check #printCheck></app-print-check>
```

**pickup-deliveries.component.ts:**
```typescript
import { Component, ViewChild } from '@angular/core';
import { PrintCheckComponent } from '../../shared/print-check/print-check.component';

export class PickupDeliveriesComponent {
  @ViewChild('printCheck') printCheckComponent: PrintCheckComponent;

  deliveries = []; // Your deliveries array

  // Simple one-line method!
  printDeliveryCheck(delivery: any) {
    this.printCheckComponent.print(delivery.id);
  }
}
```

## Backend API

The component expects a backend endpoint at:

```
GET /deliveries/print-data?delivery_id={id}
```

**Response format:**
```json
{
  "status": "ok",
  "message": "Print ma'lumotlari muvaffaqiyatli yuklandi",
  "data": {
    "idsChek": "12345",           // Customer ID
    "nameChek": "K8-CU115",       // Package barcodes
    "counterChek": 5,             // Total items count
    "weightChek": 12.5,           // Total weight
    "izohChek": "Notes here"      // Delivery notes
  }
}
```

The backend should:
1. Find the delivery by ID
2. Extract package barcodes from delivery barcode
3. Find all LeftPackages for those barcodes
4. Calculate total items count and weight
5. Return formatted data

## Print Output Format

The printed check will look like:
```
--- ⭐ Yuk Z ⭐ ---

K12345

Partiyasi: K8-CU115
Soni: 5 ta
Og'irligi: 12.5 kg
Izoh: Special handling required
```

## Benefits of This Approach

1. **Simple parent components** - Just pass delivery.id, no manual data mapping
2. **Consistent data** - Backend processes all data the same way
3. **Single source of truth** - Backend logic ensures accurate calculations
4. **Loading feedback** - Users see loading state while data is fetched
5. **Error handling** - Component handles errors automatically

## Tips

1. **Import SharedModule** - Make sure to import `SharedModule` in your module

2. **Use ViewChild correctly** - Don't forget the `@ViewChild` decorator and the template reference `#printCheck`

3. **Place component at bottom** - Add `<app-print-check #printCheck></app-print-check>` at the bottom of your template

4. **Just pass ID** - No need to create data objects, just pass `delivery.id`

## Troubleshooting

**Print component not found:**
- Make sure you imported `SharedModule` in your module

**Print not triggering:**
- Check that you're calling `this.printCheckComponent.print(delivery.id)` correctly
- Verify the ViewChild reference matches the template reference (`#printCheck`)
- Make sure delivery.id is a valid number

**Loading stuck:**
- Check browser console for errors
- Verify backend endpoint `/deliveries/print-data` is working
- Check authentication token is valid

**Error message shown:**
- Check backend logs for errors
- Verify delivery ID exists in database
- Ensure LeftPackages exist for the delivery
