import { TestBed } from '@angular/core/testing';

import { ExchangeContractService } from './exchange-contract.service';

describe('ExchangeContractService', () => {
  let service: ExchangeContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExchangeContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
