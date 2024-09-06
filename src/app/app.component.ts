import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonService } from './shared/services/common.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, AfterContentChecked {

  public isOnSignInPage!: boolean;
  public isGridView=false;
  public showoverlay=false;
constructor(
  private commonservices:CommonService,
  private cdref: ChangeDetectorRef
  ){}

 ngOnInit(): void {
  this.commonservices.showGridViewObservable.subscribe((response:boolean) =>{
      this.isGridView=response;
  })
   this.commonservices.siginpageObservable.subscribe((response: boolean) => {
    this.isOnSignInPage=response;
  })

  }

  ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }
  

}
