import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassowrdUpdateComponent } from './passowrd-update.component';

describe('PassowrdUpdateComponent', () => {
  let component: PassowrdUpdateComponent;
  let fixture: ComponentFixture<PassowrdUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PassowrdUpdateComponent]
    });
    fixture = TestBed.createComponent(PassowrdUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
