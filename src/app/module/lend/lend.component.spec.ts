import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LendComponent } from './lend.component';

describe('LendComponent', () => {
  let component: LendComponent;
  let fixture: ComponentFixture<LendComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LendComponent]
    });
    fixture = TestBed.createComponent(LendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
