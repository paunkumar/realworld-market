import { TestBed } from '@angular/core/testing';

import { FaqManagementService } from './faq-management.service';

describe('FaqManagementService', () => {
  let service: FaqManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaqManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
