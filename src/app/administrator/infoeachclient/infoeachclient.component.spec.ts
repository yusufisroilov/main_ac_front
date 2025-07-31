import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoeachclientComponent } from './infoeachclient.component';

describe('InfoeachclientComponent', () => {
  let component: InfoeachclientComponent;
  let fixture: ComponentFixture<InfoeachclientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfoeachclientComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoeachclientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
