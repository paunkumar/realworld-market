import { Component, OnInit } from '@angular/core';
import { ManageDocumentService } from '../../services/manage-document.service';

@Component({
  selector: 'app-footer-new',
  templateUrl: './footer-new.component.html',
  styleUrls: ['./footer-new.component.css']
})
export class FooterNewComponent {
year:any;
privacyPolicyUrl: string = '';
userAggrementUrl: string = '';

constructor(
  private manageDocumentService:ManageDocumentService
){

}
ngOnInit():void{
  this.year = new Date().getFullYear();
  this.getDocument();
}
/**
 * scroll to top
 */
bottomtotop(){
  window.scrollTo(0, 0);
}

 /**
   * Gets document
   */
 getDocument(){
  this.manageDocumentService.getDocument('privacy_policy').subscribe((response:any) => {
    if(response['data'].file){
    this.privacyPolicyUrl = response['data'].file[0].Url;
    }
  })
  this.manageDocumentService.getDocument('user_agreement').subscribe((response:any) => {
    if(response['data'].file){
    this.userAggrementUrl = response['data'].file[0].Url;
    }
  })
}

}