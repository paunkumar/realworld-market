import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailverficationComponent } from './mailverfication.component';

describe('MailverficationComponent', () => {
  let component: MailverficationComponent;
  let fixture: ComponentFixture<MailverficationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MailverficationComponent]
    });
    fixture = TestBed.createComponent(MailverficationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
