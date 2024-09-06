import { TestBed } from '@angular/core/testing';

import { OnboardAssetService } from './onboard-asset.service';

describe('OnboardAssetService', () => {
  let service: OnboardAssetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnboardAssetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
