import { TestBed } from '@angular/core/testing';

import { CustomtooltipService } from './customtooltip.service';

describe('CustomtooltipService', () => {
  let service: CustomtooltipService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomtooltipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
