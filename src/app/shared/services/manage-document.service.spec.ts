import { TestBed } from '@angular/core/testing';

import { ManageDocumentService } from './manage-document.service';

describe('ManageDocumentService', () => {
  let service: ManageDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManageDocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
