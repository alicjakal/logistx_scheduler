import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map, catchError } from 'rxjs/operators';
// import { InterceptorService } from 'ng2-interceptors';
import { HttpClient } from '@angular/common/http';

const API_URL: string = window['baseLink'];
// const API_URL: string = 'http://localhost:8163/main';
// const IS_ADMIN: string = window['isAdmin'];
const IS_ADMIN: string = '1';

@Injectable()
export class SchedulerLbeService {
    headers: any;
    isAdmin = false;

    constructor(public http: HttpClient) {
        console.log('IS_ADMIN:', IS_ADMIN);
        this.isAdmin = IS_ADMIN === '1';
    }

    getUserDetails(userId: any = ''): Observable<any> {
        const url = API_URL + '/schedulers/metadata.json';
        return this.http.get(url)
            .pipe(
                catchError(this.handleError),
                map(this.extractData)
            );
    }

    private extractData(res: Response): any {
        const body = res.json();
        return body || {};
    }

    private handleError(error: any): Observable<any> {
        const errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg);
        return Observable.throw(errMsg);
    }
}
