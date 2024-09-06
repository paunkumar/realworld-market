import { TestBed } from '@angular/core/testing';

import { GltfLoaderService } from './gltf-loader.service';

describe('GltfLoaderService', () => {
  let service: GltfLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GltfLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
