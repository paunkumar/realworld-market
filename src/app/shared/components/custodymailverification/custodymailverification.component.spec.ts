import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustodymailverificationComponent } from './custodymailverification.component';

describe('CustodymailverificationComponent', () => {
  let component: CustodymailverificationComponent;
  let fixture: ComponentFixture<CustodymailverificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustodymailverificationComponent]
    });
    fixture = TestBed.createComponent(CustodymailverificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
