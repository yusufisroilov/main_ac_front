import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllboxesComponent } from './allboxes.component';

describe('AllboxesComponent', () => {
  let component: AllboxesComponent;
  let fixture: ComponentFixture<AllboxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllboxesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllboxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
