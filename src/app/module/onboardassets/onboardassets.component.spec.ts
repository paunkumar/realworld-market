import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardassetsComponent } from './onboardassets.component';

describe('OnboardassetsComponent', () => {
  let component: OnboardassetsComponent;
  let fixture: ComponentFixture<OnboardassetsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OnboardassetsComponent]
    });
    fixture = TestBed.createComponent(OnboardassetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
