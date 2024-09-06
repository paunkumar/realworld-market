import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BorrowLoanComponent } from './borrow-loan.component';

describe('BorrowLoanComponent', () => {
  let component: BorrowLoanComponent;
  let fixture: ComponentFixture<BorrowLoanComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BorrowLoanComponent]
    });
    fixture = TestBed.createComponent(BorrowLoanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
