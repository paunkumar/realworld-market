import { TestBed } from '@angular/core/testing';

import { IdenfyService } from './idenfy.service';

describe('IdenfyService', () => {
  let service: IdenfyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdenfyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
