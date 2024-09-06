import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable()
export class RegulatedInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let modifiedReq: any = request

    if(request.url.includes('idenfy')) {
      const credentials = Buffer.from(`${environment.IDENFY_API_KEY}:${environment.IDENFY_API_SECRET}`).toString('base64');
      modifiedReq = request.clone({ 
        headers: request.headers.set('Authorization', `Basic ${credentials}`),
      });
    } else {
      const regulated = localStorage.getItem('regulated') || 'true';
      const user: any = JSON.parse(localStorage.getItem('user') || 'null');
      const chainId = localStorage.getItem('account') ? JSON.parse(localStorage.getItem('account') || '')['networkId'] : environment.DEFAULT_NETWORK;
      let headers = (!user) ? request.headers.set('regulated', regulated).set('Chain-id', chainId.toString()) : request.headers.set('regulated', regulated).set('Chain-id', chainId.toString()).set('Authorization', `Bearer ${user?.token}`);
      modifiedReq = request.clone({headers});
    }
    return next.handle(modifiedReq);
  }
}