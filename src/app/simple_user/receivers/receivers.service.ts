import { GlobalVars } from 'src/app/global-vars';
import {Injectable} from '@angular/core'
import { Http, RequestOptions, Headers } from '@angular/http'
import 'rxjs/add/operator/map'
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class ReceiverService {
    constructor (private http: Http, private httpClient: HttpClient)
    {

    }

    
    receivers: any[];

    getlistofrecs(){
        
        let headers = new Headers({'Content-Type': 'application/json'});
        headers.append('Authorization',localStorage.getItem('token'));


    let options = new RequestOptions({ headers: headers });
        

    return this.http.get(GlobalVars.baseUrl + '/receivers/list', options)
    .subscribe(response => {
        return response.json();
    })

    }


}
