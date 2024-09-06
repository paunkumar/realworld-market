import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YouritemsComponent } from './youritems.component';

describe('YouritemsComponent', () => {
  let component: YouritemsComponent;
  let fixture: ComponentFixture<YouritemsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [YouritemsComponent]
    });
    fixture = TestBed.createComponent(YouritemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
