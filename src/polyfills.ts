import { Buffer } from 'buffer';
declare var global: any;
declare var require: any
(window as any).global = window;
global.Buffer = Buffer;
global.process = {
    env: { DEBUG: undefined },
    version: '',
    nextTick: require('next-tick')
} as any;
/***************************************************************************************************
* SCULLY IMPORTS
*/
// tslint:disable-next-line: align
import 'zone.js/dist/task-tracking';
