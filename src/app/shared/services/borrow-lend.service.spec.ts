import { TestBed } from '@angular/core/testing';

import { BorrowLendService } from './borrow-lend.service';

describe('BorrowLendService', () => {
  let service: BorrowLendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BorrowLendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
