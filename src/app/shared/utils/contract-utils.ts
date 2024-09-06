import Web3 from "web3";
export class ContractUtils {

  /**
   * Decimals multipler
   * @param [multipler]
   * @param [value]
   * @returns
   */
  decimalMultipler(multipler = 1, value = 0) {
    let decimalValue: any = 0;
    try {
      // @ts-ignore
      const web3 = new Web3(window['ethereum']);
      let weiValue = web3.utils.toWei(value.toString(), 'ether');
      switch (multipler) {
        case 18:
          decimalValue = weiValue;
          break;
        case 9:
          decimalValue = web3.utils.fromWei(weiValue, 'gwei');
          break;
        case 6:
          decimalValue = web3.utils.fromWei(weiValue, 'micro');
          break;
        default:
          decimalValue = value / Math.pow(10, multipler);
          break;
      }
      return decimalValue;
    }
    catch (e) {
      console.log('exception...', e);
    }
    finally {
      return decimalValue;
    }
  }

  /**
   * Decimals divider
   * @param [divider]
   * @param [value]
   * @returns
   */
  decimalDivider(divider = 1, value: string = '0') {
    // @ts-ignore
    const web3 = new Web3(window['ethereum']);
    let originalValue;
    try {
      switch (Number(divider)) {
        case 18: {
          let weiValue = web3.utils.fromWei(value.toString(), 'ether');
          originalValue = weiValue;
          break;
        }
        case 9: {
          let weiValue = web3.utils.fromWei(value.toString(), 'gwei');
          originalValue = weiValue;
          break;
        }
        case 6: {
          let weiValue = web3.utils.fromWei(value.toString(), 'mwei');
          originalValue = weiValue;
          break;
        }
        default: {
          originalValue = Number(value) / Math.pow(10, (18 - divider));
          break;
        }
      }
      return originalValue;
    }
    catch (e) {
      console.log('conversion exception..', e);
    }
    finally {
      return originalValue;
    }
  }

}
