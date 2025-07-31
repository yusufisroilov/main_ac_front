import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocPrintComponent } from './doc-print.component';

describe('DocPrintComponent', () => {
  let component: DocPrintComponent;
  let fixture: ComponentFixture<DocPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocPrintComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
