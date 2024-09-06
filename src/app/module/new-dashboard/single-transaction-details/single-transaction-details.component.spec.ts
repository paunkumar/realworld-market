import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleTransactionDetailsComponent } from './single-transaction-details.component';

describe('SingleTransactionDetailsComponent', () => {
  let component: SingleTransactionDetailsComponent;
  let fixture: ComponentFixture<SingleTransactionDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SingleTransactionDetailsComponent]
    });
    fixture = TestBed.createComponent(SingleTransactionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
