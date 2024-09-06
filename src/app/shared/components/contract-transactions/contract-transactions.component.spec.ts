import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransactionsComponent } from './contract-transactions.component';

describe('ContractTransactionsComponent', () => {
  let component: ContractTransactionsComponent;
  let fixture: ComponentFixture<ContractTransactionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContractTransactionsComponent]
    });
    fixture = TestBed.createComponent(ContractTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
