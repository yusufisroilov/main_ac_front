import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.css']
})
export class LabelComponent implements OnInit {

  barcodeVal: string;

  constructor() {

    this.barcodeVal = localStorage.getItem('barval');
    this.printFun();
   }

  ngOnInit(): void {
 
     
  }

  printFun(){
  
    let printContents, popupWin;
    printContents = document.getElementById('print-section2').innerHTML;
    popupWin = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
    popupWin.document.open();
   // printContents = document.getElementById('print-section2').innerHTML;
    popupWin.document.write(`
    <html>
    <head>
      <title>Print tab</title>
      <style>
      //........Customized style.......
      </style>
    </head>
    <body onload="window.print();window.close()">  ${printContents}  </body>
  </html>`
    );
    popupWin.document.close();
 



  }



}
