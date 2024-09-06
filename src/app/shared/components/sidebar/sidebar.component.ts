import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from 'src/app/shared/services/common.service';
import { BorrowLendService } from '../../services/borrow-lend.service';
import { WebStorageService } from '../../services/web-storage.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isGridView: boolean = true;
  showoverlay: boolean =false;
  clickedTabName!:string;
  user: any;

  constructor(
    private commonService:CommonService,
    private webStorageService: WebStorageService,
    private borrowLendService: BorrowLendService,
    private toastr: ToastrService,
    private router: Router
  ){}

  ngOnInit() {
    this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
    this.gridView(JSON.parse(this.webStorageService.getLocalStorage('gridView') || 'true'));
    this.commonService.tabEmitterObserve.subscribe((clickedTab)=>{
      if(Object.keys(clickedTab).length > 0){
        this.clickedTabName = clickedTab.type;
      }
    })
    this.commonService.showmodaloverlayObservable.subscribe((response:boolean) => this.showoverlay = response)

  }
  closeOveraly(){
    this.showoverlay=false;
    this.commonService.setOverlay(false)
  }

  public gridView(isGridView:boolean){
    this.isGridView = isGridView;
    this.commonService.setView(isGridView);
    this.webStorageService.setLocalStorage('gridView', isGridView)
  }

  onMenuClick(menu:string){
    this.commonService.setTabEmitter({type:menu});
  }

  redirectToLend() {
    if(this.user?._id) {
      this.borrowLendService.getUserLendingStatus(this.user?._id).subscribe({
        next: async (res: any) => {
          if(res.data?.is_lender_activity) this.router.navigate(['/lending-history']);
          else this.router.navigate(['/lend']);
        },
        error: (error: any) => {
          this.router.navigate(['/lend']);
        }
      })
    } else {
      this.router.navigate(['/lend']);
    }
  }

  redirectToBorrow() {
    if(this.user?._id) {
      this.borrowLendService.getUserBorrowStatus(this.user?._id).subscribe({
        next: async (res: any) => {
          if(!res.data?.hasLiveLoans) this.router.navigate(['/loan-request']);
          else this.router.navigate(['/borrow']);
        },
        error: (error: any) => {
          this.router.navigate(['/borrow']);
        }
      })
    } else {
      this.router.navigate(['/borrow']);
    }
  }
}
