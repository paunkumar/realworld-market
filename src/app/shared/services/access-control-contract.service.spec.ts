import { TestBed } from '@angular/core/testing';

import { AccessControlContractService } from './access-control-contract.service';

describe('AccessControlContractService', () => {
  let service: AccessControlContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessControlContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
