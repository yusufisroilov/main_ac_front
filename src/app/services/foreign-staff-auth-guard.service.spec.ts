import { TestBed } from '@angular/core/testing';

import { ForeignStaffAuthGuard } from './foreign-staff-auth-guard.service';

describe('ForeignStaffAuthGuardService', () => {
  let service: ForeignStaffAuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForeignStaffAuthGuard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
