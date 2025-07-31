import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EachboxdocComponent } from './eachboxdoc.component';

describe('EachboxdocComponent', () => {
  let component: EachboxdocComponent;
  let fixture: ComponentFixture<EachboxdocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EachboxdocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EachboxdocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
