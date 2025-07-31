import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveOrdersComponent } from './archive-orders.component';

describe('ArchiveOrdersComponent', () => {
  let component: ArchiveOrdersComponent;
  let fixture: ComponentFixture<ArchiveOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArchiveOrdersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchiveOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
