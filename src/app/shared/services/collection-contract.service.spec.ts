import { TestBed } from '@angular/core/testing';

import { CollectionContractService } from './collection-contract.service';

describe('CollectionContractService', () => {
  let service: CollectionContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollectionContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
