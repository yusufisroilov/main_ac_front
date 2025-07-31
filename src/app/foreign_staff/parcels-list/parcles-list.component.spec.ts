import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParclesListComponent } from './parcles-list.component';

describe('ParclesListComponent', () => {
  let component: ParclesListComponent;
  let fixture: ComponentFixture<ParclesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParclesListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParclesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
