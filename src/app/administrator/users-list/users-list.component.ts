import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalVars, StatusOfOrder, TypesOfOrder } from 'src/app/global-vars';
import swal from 'sweetalert2';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Http, RequestOptions, Headers, Response } from '@angular/http'
import { AuthService } from 'src/app/pages/login/auth.service';
import { data } from 'jquery';


declare interface DataTable {
  headerRow: string[];
  dataRows: string[][];
}

declare const $: any;

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {

  
  public dataTable: DataTable;
 
  headers12: any;
  options: any;
  allUsersData: any;
  helloText: string;
  registredMessage: any;

  trackingNum2: any;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;

  newAdvalue:string;

  constructor(private http: Http, private httpClient: HttpClient,private router: Router,public authService: AuthService) {

    

   
    this.headers12 = new Headers({ 'Content-Type': 'application/json' });
    this.headers12.append('Authorization', localStorage.getItem('token'));
    this.options = new RequestOptions({ headers: this.headers12 },);
    
    this.currentPage = 0;
    this.helloText = "hello"
    this.needPagination = false;
    this.isPageNumActive = false;

   }

  ngOnInit(): void {

    this.dataTable = {
      headerRow: ['No', 'Mijoz IDsi', 'Telefon nomeri', 'Ismi sharfi', 'Ro\'yhatdan o\'tgan sanasi', '...', 'Amallar'],

      dataRows:
        [

        ]
    };


  }

  pagebyNum(ipage){

    this.currentPage = ipage;
    this.isPageNumActive = true;
    document.getElementById("listcard").scrollIntoView();
    this.getListOfUsers();

  }
  
  getListOfUsers(){
   
   

    return  this.http.get(GlobalVars.baseUrl+'/users/list?page='+ this.currentPage+'&size=100', this.options)
      .subscribe(response => {
        this.allUsersData = response.json().users;

       
        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        }

      }, error => {
        if (error.status == 403) {

          this.authService.logout();
          
        }
    })
  }

  getListOfUsersWithFilter(username,id,firstName, lastName){
    
    
  // let filterLink = '&status='+status+"&orderType="+type+"&ownerID="+ownerid;
    return  this.http.get(GlobalVars.baseUrl+'/users/list?page='+ this.currentPage+'&size=50'+'&username='+ username+'&id='+id + '&first_name=' + firstName + '&last_name='+ lastName, this.options)
      .subscribe(response => {
        this.allUsersData = response.json().users;

        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        }

      }, error => {
        if (error.status == 403) {

          this.authService.logout();
          
        }
    })
  }

  copyInputMessage(inputElement) {
    inputElement.select();
    document.execCommand("copy");
    inputElement.setSelectionRange(0, 0);
  }

  recordNewClient() {


    swal.fire({
      title: 'Yangi mijoz yaratish!',
      position: 'top',
      confirmButtonText: "Yaratish",
      html: '<div class="form-group">' +
        '<input id="input-name" type="text" class="form-control m-2" placeholder="Ism" />' +
        '<input  id="input-surname" type="text" class="form-control m-2" placeholder="Familya" />'+
        '<input  id="input-pass" type="text" class="form-control m-2" placeholder="Parol" />' +
        '<input  id="input-phone" type="text" class="form-control m-2" placeholder="Telefon Nomer" />' +

        '</div>',
      
      customClass: {
        confirmButton: 'btn btn-success',
      },
      buttonsStyling: false,
      didOpen: () => {

          var ele = $('input[id=input-trnum]').filter(':visible').focus();
          
          var options = [];
          for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
              options.push('<option value="',
              GlobalVars.orderTypes[i].id, '">',
              GlobalVars.orderTypes[i].description_en, '</option>');
          }
          
          $("#types").html(options.join(''));

      },
      preConfirm: (result) => {

        let name = $('#input-name').val();
        let surname = $('#input-surname').val();
        let password = $('#input-pass').val();
        let phone_num = $('#input-phone').val();
    
        const dataUser = {'username': phone_num, 'password': password,'first_name': name, 'last_name': surname};


        this.http.post(GlobalVars.baseUrl + '/register', dataUser, this.options)
          .subscribe(response => {

            if (response.json().status == 'error') {

              this.registredMessage = response.json().message;
              // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
              swal.fire('Not Added', this.registredMessage, 'error').then((result) => {
                if (result.isConfirmed) {
                  this.getListOfUsers();
                }
              }
              )
            } else {
              var newId = response.json().id;
              swal.fire({
                icon: 'success',
                title: 'Mijoz qoshildi!',
                html: '<div><b>Kent GA:</b> <br>Sizning yangi IDingiz: K' + newId + '<br>  Sistemaga kirish uchun: <br> Link: my.acargo.uz \n  <br>' +
                'Login: ' + phone_num + ' <br>'+
                'Parol: '+ phone_num + ' <br>'+
                '易洋K'+ newId +  ' <br>'+
                '18028594657' + ' <br>'+
                '广州市白云区太和镇龙归南村三姓南街43号1楼原好客源超市K' + newId + ' <br>'+
                'Manzilni taobaoga yoki pindoudoga kirting. Poscode sorasa: 510440 yozing va kiritgan manzilni bizga tekshirtiring, tekshirtirgandan so\'ng  zakaz ursangiz bo\'laveradi  ' +
        
                '</div>',
               // footer: '<a href="">Why do I have this issue?</a>'
              }).then((result) => {
                if (result.isConfirmed) {
                  this.getListOfUsers();
                }
              });

              return false;
            }

          }, error => {
            if (error.status == 400) {
              swal.fire('Not Added', "BAD REQUEST: WRONG TYPE OF INPUT", 'error').then((result) => {
                if (result.isConfirmed) {
                  
                 
                  
                  this.getListOfUsers();
                }
              }
              )
            }

              if (error.status == 403) {
      
                this.authService.logout();
                
              }
          


          }
          )
      }
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.getListOfUsers();

      }

    });

  }


  editClient(id,username,name,lname) {


    swal.fire({
      title: 'Yangi mijoz yaratish!',
      position: 'top',
      confirmButtonText: "Yaratish",
      html: '<div class="form-group">' +
        '<input id="input-name" type="text" class="form-control m-2" placeholder="Ism" />' +
        '<input  id="input-surname" type="text" class="form-control m-2" placeholder="Familya" />'+
        // '<input  id="input-pass" type="text" class="form-control m-2" placeholder="Parol" />' +
        '<input  id="input-phone" type="text" class="form-control m-2" placeholder="Telefon Nomer" />' +

        '</div>',
      
      customClass: {
        confirmButton: 'btn btn-success',
      },
      buttonsStyling: false,
      didOpen: () => {

          var ele = $('input[id=input-trnum]').filter(':visible').focus();
          
          $('#input-phone').val(username);
          $('#input-name').val(name);
          $('#input-surname').val(lname);
          // var options = [];
          // for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
          //     options.push('<option value="',
          //     GlobalVars.orderTypes[i].id, '">',
          //     GlobalVars.orderTypes[i].descriptionEn, '</option>');
          // }
          
          // $("#types").html(options.join(''));

      },
      preConfirm: (result) => {

        let name = $('#input-name').val();
        let surname = $('#input-surname').val();
        let password = $('#input-pass').val();
        let phone_num = $('#input-phone').val();
    
        const dataUser = {'username': phone_num, 'password': password,'first_name': name, 'last_name': surname};


        this.http.post(
          GlobalVars.baseUrl +
            "/edit_client?username=" +
            phone_num +
            "&id=" +
            id +
            "&firstName=" +
            name +
            "&lastName=" +
            surname,
          "",
          this.options
        )
        .subscribe(response => {

            if (response.json().status == 'error') {

              this.registredMessage = response.json().message;
              // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
              swal.fire('Not Added', this.registredMessage, 'error').then((result) => {
                if (result.isConfirmed) {
                  this.getListOfUsers();
                }
              }
              )
            } else {

           
              return false;
            }

          }, error => {
            if (error.status == 400) {
              swal.fire('Not Added', "BAD REQUEST: WRONG TYPE OF INPUT", 'error').then((result) => {
                if (result.isConfirmed) {
                  this.getListOfUsers();
                }
              }
              )
            }

              if (error.status == 403) {
      
                this.authService.logout();
                
              }
          


          }
          )
      }
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.getListOfUsers();

      }

    });

  }

  changePassword(iddd)
  {
     
    swal.fire({
      title: 'Parolni o\'zgartirish',
      text: "Ushbu C" + iddd + " ID ga yangi parolni kiriting!",
      allowEnterKey: true,
      input: 'text',
      confirmButtonText: "Saqlash",
      showCancelButton: true,
      cancelButtonText: "No",
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-info',
      },
      buttonsStyling: false,
      
      preConfirm: (valueB) => {

        this.http.post(
          GlobalVars.baseUrl + "/change_password?newPassword=" + valueB + "&id=" + iddd,
          "",
          this.options
        ).subscribe(response => {

              if (response.json().status == "error") {
                
                swal.fire(
                  'O\'zgarmadi!',
                  'Xato: ' + response.json().message,
                  'error'
                )
                this.getListOfUsers();
          
              } else 
              {

                swal.fire(
                  'O\'zgartirildi!',
                  'Yangi paroldan foydalanish mumkin!',
                  'success'
                )
                this.getListOfUsers();

              }
            }, error => {
              if (error.status == 400) {
                this.getListOfUsers(); 
              } else if (error.status == 403) {
                this.getListOfUsers();
              }
            })

          },

          }).then((result) => {
            if (result.isConfirmed) {
              swal.fire(
                'O\'zgartirildi!',
                'Yangi paroldan foydalanish mumkin!',
                'success'
              )
            this.getListOfUsers();
            } else 
            {
              swal.fire(
                'O\'zgarmadi!',
                'Xato!',
                'error'
              )
              this.getListOfUsers();
            }
          } 
          )



  }
 

  changePhoneNumber(iddd)
  {
     
    swal.fire({
      title: 'telefon nomerni o\'zgartirish',
      text: "Ushbu C" + iddd + " ID ga yangi telefon nomer kiriting!",
      allowEnterKey: true,
      input: 'text',
      confirmButtonText: "Saqlash",
      showCancelButton: true,
      cancelButtonText: "No",
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-info',
      },
      buttonsStyling: false,
      
      preConfirm: (valueB) => {

        this.http.post(
          GlobalVars.baseUrl + "/change_username?newUsername=" + valueB + "&id=" + iddd,
          "",
          this.options
        ).subscribe(response => {

              if (response.json().status == "error") {
                
                swal.fire(
                  'O\'zgarmadi!',
                  'Xato: ' + response.json().message,
                  'error'
                )
                this.getListOfUsers();
          
              } else 
              {

                swal.fire(
                  'O\'zgartirildi!',
                  'Yangi tel nomerdan foydalanish mumkin!',
                  'success'
                )
                this.getListOfUsers();

              }
            }, error => {
              if (error.status == 400) {
                this.getListOfUsers(); 
              } else if (error.status == 403) {
                this.getListOfUsers();
              }
            })

          },

          }).then((result) => {
            if (result.isConfirmed) {
              swal.fire(
                'O\'zgartirildi!',
                'Yangi nomerdan foydalanish mumkin!',
                'success'
              )
            this.getListOfUsers();
            } else 
            {
              swal.fire(
                'O\'zgarmadi!',
                'Xato!',
                'error'
              )
              this.getListOfUsers();
            }
          } 
          )



  }
 

  ngAfterViewInit() {

    return this.getListOfUsers();
  
    }
  


}
