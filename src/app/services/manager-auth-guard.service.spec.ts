import { TestBed } from '@angular/core/testing';

import { ManagerAuthGuardService } from './manager-auth-guard.service';

describe('ManagerAuthGuardService', () => {
  let service: ManagerAuthGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManagerAuthGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
