import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsignmentListComponent } from './consignment-list.component';

describe('ConsignmentListComponent', () => {
  let component: ConsignmentListComponent;
  let fixture: ComponentFixture<ConsignmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsignmentListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsignmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
