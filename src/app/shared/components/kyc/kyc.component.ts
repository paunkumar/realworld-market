import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { IdenfyService } from '../../services/idenfy.service';
import { WebStorageService } from '../../services/web-storage.service';

@Component({
  selector: 'app-kyc',
  templateUrl: './kyc.component.html',
  styleUrls: ['./kyc.component.css']
})
export class KycComponent implements OnDestroy {

  url: any;
  user: any;
  loading: boolean = true;

  constructor(
    private idenfyService: IdenfyService,
    private webStorageService: WebStorageService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
    if(this.user) this.generateToken();
    window.addEventListener("message", this.handleStatus, false);
  }

  generateToken() {
    this.idenfyService.generateToken(this.user.name).subscribe({
      next: (response: any) => {
        this.url = `https://ui.idenfy.com/?authToken=${response.authToken}`;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error('Unable to process KYC. Contact admin for more details')
      }
    })
  }

  handleStatus = (event: any) => {
    if(event.data?.status === 'approved') this.router.navigate(['kyc-verify/success'])
    if(event.data?.status === 'failed') this.router.navigate(['kyc-verify/failed'])
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.handleStatus, false);
  }
}
