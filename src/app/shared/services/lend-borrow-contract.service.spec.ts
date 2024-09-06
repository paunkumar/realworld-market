import { TestBed } from '@angular/core/testing';

import { LendBorrowContractService } from './lend-borrow-contract.service';

describe('LendBorrowContractService', () => {
  let service: LendBorrowContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LendBorrowContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
