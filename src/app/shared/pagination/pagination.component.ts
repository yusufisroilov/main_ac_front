import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnInit,
} from "@angular/core";
import swal from "sweetalert2";

@Component({
  selector: "app-pagination",
  standalone: false,
  templateUrl: "./pagination.component.html",
  styleUrls: ["./pagination.component.css"],
})
export class PaginationComponent implements OnChanges, OnInit {
  @Input() currentPage: number = 0;
  @Input() totalPages: number = 1;
  @Input() maxVisiblePages: number = 7;

  @Output() pageChanged = new EventEmitter<number>();

  visiblePages: number[] = [];
  inputPageNumber: number;

  ngOnInit(): void {
    this.updateVisiblePages(); // ✅ Call on initial load
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log(
      "current page ",
      this.currentPage,
      this.totalPages,
      this.maxVisiblePages
    );

    if (changes.currentPage || changes.totalPages) {
      this.updateVisiblePages();
    }
  }

  /**
   * Calculate which page numbers should be visible
   */
  private updateVisiblePages(): void {
    this.visiblePages = [];

    let startPage = Math.max(
      0,
      this.currentPage - Math.floor(this.maxVisiblePages / 2)
    );
    let endPage = Math.min(
      this.totalPages - 1,
      startPage + this.maxVisiblePages - 1
    );

    // Adjust start if we're near the end
    if (endPage - startPage < this.maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - this.maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      this.visiblePages.push(i);
    }
  }

  /**
   * Handle page change
   */
  onPageChange(pageIndex: number): void {
    if (
      pageIndex >= 0 &&
      pageIndex < this.totalPages &&
      pageIndex !== this.currentPage
    ) {
      this.pageChanged.emit(pageIndex);
      this.inputPageNumber = null; // Clear input
    }
  }

  /**
   * Go to previous page
   */
  onPreviousPage(): void {
    if (this.currentPage > 0) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  /**
   * Go to next page
   */
  onNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  /**
   * Go to page entered in input
   */
  onGoToPage(): void {
    if (
      this.inputPageNumber &&
      this.inputPageNumber >= 1 &&
      this.inputPageNumber <= this.totalPages
    ) {
      this.onPageChange(this.inputPageNumber - 1); // Convert to 0-based index
    } else {
      // console.log("Pagenumber ", this.inputPageNumber);
      swal.fire({
        icon: "warning",
        title: "Noto'g'ri sahifa",
        text: `Iltimos, 1 dan ${this.totalPages} gacha bo'lgan sahifa raqamini kiriting`,
        customClass: {
          confirmButton: "btn btn-warning",
        },
        buttonsStyling: false,
      });
    }
  }

  /**
   * Handle Enter key press
   */
  onKeyPress(event: KeyboardEvent): void {
    console.log("event ", event);

    if (event.key === "Enter") {
      this.onGoToPage();
    }
  }
}
