import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BorrowHistoryComponent } from './borrow-history.component';

describe('BorrowHistoryComponent', () => {
  let component: BorrowHistoryComponent;
  let fixture: ComponentFixture<BorrowHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BorrowHistoryComponent]
    });
    fixture = TestBed.createComponent(BorrowHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
