import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UzParclesListComponent } from './parcles-list.component';

describe('ParclesListComponent', () => {
  let component: UzParclesListComponent;
  let fixture: ComponentFixture<UzParclesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UzParclesListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UzParclesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
