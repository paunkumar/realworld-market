import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionsDetailsComponent } from './transactions-details.component';

describe('TransactionsDetailsComponent', () => {
  let component: TransactionsDetailsComponent;
  let fixture: ComponentFixture<TransactionsDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionsDetailsComponent]
    });
    fixture = TestBed.createComponent(TransactionsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
