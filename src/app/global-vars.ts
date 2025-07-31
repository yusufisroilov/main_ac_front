import { Injectable } from "@angular/core";

export class GlobalVars {
   public static baseUrl: string = "http://185.196.213.248:3033";
 //public static baseUrl: string = "http://localhost:3033";
  // public static baseUrl3030: string = "http://185.196.214.140:3030";
  // public static testUrl: string = "http://192.168.0.114:2323"

  public static siteTitle: string = "This is example of ActiveCargo";


  public static currentParty: string = "";

  //For Order types
  public static orderTypes: TypesOfOrder[];

  public static getDescriptions(lang: string) {
    var descArray = [];

    for (let index = 0; index < this.orderTypes.length; index++) {
      switch (lang) {
        case "en":
          descArray.push(this.orderTypes[index].description_en);
          break;
        case "ru":
          descArray.push(this.orderTypes[index].description_ru);
          break;
        case "uz":
          descArray.push(this.orderTypes[index].description_uz);
          break;
        default:
          break;
      }
    }
    return descArray;
  }
  public static getDescriptionWithID(id, lang: string) {
    var desc = "";

    for (let index = 0; index < this.orderTypes.length; index++) {
      if (this.orderTypes[index].id == id) {
        switch (lang) {
          case "en":
            return this.orderTypes[index].description_en;
          case "ru":
            return this.orderTypes[index].description_ru;
          case "uz":
            return this.orderTypes[index].description_uz;
          default:
            break;
        }
      }
    }
    return "not found";
  }

  //For Order Status types
  public static orderStatus: StatusOfOrder[];
  public static getDescOrderStatus(lang: string) {
    var descOrArray = [];

    for (let index = 0; index < this.orderStatus.length; index++) {
      switch (lang) {
        case "en":
          descOrArray.push(this.orderStatus[index].description_en);
          break;
        case "ru":
          descOrArray.push(this.orderStatus[index].description_ru);
          break;
        case "uz":
          descOrArray.push(this.orderStatus[index].description_uz);
          break;
        default:
          break;
      }
    }
    return descOrArray;
  }
  public static getDesOrderStatusWithID(id, lang: string) {
    for (let index = 0; index < this.orderStatus.length; index++) {
      if (this.orderStatus[index].id == id) {
        switch (lang) {
          case "en":
            return this.orderStatus[index].description_en;
          case "ru":
            return this.orderStatus[index].description_ru;
          case "uz":
            return this.orderStatus[index].description_uz;
          default:
            break;
        }
      }
    }
    return "order status not found";
  }
}

@Injectable()
export class TypesOfOrder {
  description_en: string;
  description_uz: string;
  id: string;
  description_ru: string;
}

@Injectable()
export class StatusOfOrder {
  description_en: string;
  description_uz: string;
  id: string;
  description_ru: string;
}
