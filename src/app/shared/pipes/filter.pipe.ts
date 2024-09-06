import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPipe'
})
export class FilterPipe implements PipeTransform {

  async transform(items: any[], cname: any[], ldata: any[], cData: any[]) {
    let data: any[] = items;
    if(cname.length > 0) {
      data = await data.filter(item => {
        return cname.some(text => {
          return item.collections.name === text;
        })
      });
    }
    if (ldata.length > 0 ) {
      data = await data.filter(item => {
        return ldata.some(text => {
          return JSON.stringify(item.attributes).includes(text);
        })
      });
    }
    if (cData.length > 0 ) {
      data = await data.filter(item => {
        return cData.some(text => {
          return item.attributes.some((obj: any) => obj.value === text);
        })
      });
    }
    return data;
  }
}
