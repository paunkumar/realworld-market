import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdenfyRedirectionComponent } from './idenfy-redirection.component';

describe('IdenfyRedirectionComponent', () => {
  let component: IdenfyRedirectionComponent;
  let fixture: ComponentFixture<IdenfyRedirectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IdenfyRedirectionComponent]
    });
    fixture = TestBed.createComponent(IdenfyRedirectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
