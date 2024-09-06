import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderNewComponent } from './header-new.component';

describe('HeaderNewComponent', () => {
  let component: HeaderNewComponent;
  let fixture: ComponentFixture<HeaderNewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderNewComponent]
    });
    fixture = TestBed.createComponent(HeaderNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
