import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BigBoxesComponent } from './big-boxes.component';

describe('BigBoxesComponent', () => {
  let component: BigBoxesComponent;
  let fixture: ComponentFixture<BigBoxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BigBoxesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BigBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
