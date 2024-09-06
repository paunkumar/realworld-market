import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedeemAssetComponent } from './redeem-asset.component';

describe('RedeemAssetComponent', () => {
  let component: RedeemAssetComponent;
  let fixture: ComponentFixture<RedeemAssetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RedeemAssetComponent]
    });
    fixture = TestBed.createComponent(RedeemAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
