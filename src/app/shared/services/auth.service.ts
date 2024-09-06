import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { WebStorageService } from './web-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: any;
  constructor(
    private webStorageService: WebStorageService,
    private router:Router
  ) { }

  /**
   * Determines whether activate can
   * @returns
   */
  canActivate(){
    this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;

    if (this.user?.name && this.user?.email_verified) {
      this.router.navigate(['/dashboard']);
      return false;
    } else {
      return true;
    }

  }
}
