import { TestBed } from '@angular/core/testing';

import { Erc20ContractService } from './erc20-contract.service';

describe('Erc20ContractService', () => {
  let service: Erc20ContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Erc20ContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
