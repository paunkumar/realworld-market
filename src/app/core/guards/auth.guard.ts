import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const storage = inject(WebStorageService);
  const router = inject(Router);
  const user = storage.getLocalStorage('user') != null ? JSON.parse(storage.getLocalStorage('user') || 'undefined') : {};
  const regulated = JSON.parse(storage.getLocalStorage('regulated') || 'true');

  if (regulated) {
    if (!user || !Object.keys(user).length || user.email_verified) {
      return true;
    } else {
      router.navigate(['/verify-email']);
      return false;
    }
  }
  return true;


};
