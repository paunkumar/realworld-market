import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NftsListingComponent } from './nfts-listing.component';

describe('NftsListingComponent', () => {
  let component: NftsListingComponent;
  let fixture: ComponentFixture<NftsListingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NftsListingComponent]
    });
    fixture = TestBed.createComponent(NftsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
