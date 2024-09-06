import { Component, OnInit } from '@angular/core';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-pagenotfound',
  templateUrl: './pagenotfound.component.html',
  styleUrls: ['./pagenotfound.component.css']
})
export class PagenotfoundComponent implements OnInit {
  showoverlay:boolean=false;
  constructor(private commonService:CommonService){

  }
  ngOnInit(){
    this.commonService.showmodaloverlayObservable.subscribe((response:boolean) => this.showoverlay = response)
  }
}
