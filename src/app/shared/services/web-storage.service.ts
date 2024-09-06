import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebStorageService {

  constructor() { }

  /**
   * Store data in localstorage
   * @param {string} key
   * @param {any} value
   */
  setItem = (key: string, value: any) => {
    sessionStorage.setItem(key, value);
  }

  /**
   * Get data from localstorage
   * @param {string} key
   * @return {string} value of the key from local storage
   */
  getItem = (key: string) => {
    return sessionStorage.getItem(key);
  }

  /**
   * Remove data from localstorage
   * @param {string} key
   * @return {string} value
   */
  removeItem = (key: string) => {
    return sessionStorage.removeItem(key);
  }

  /**
   * clear data from localstorage
   */
  clearItem = () => {
    sessionStorage.clear();
    let regulated = JSON.parse(this.getLocalStorage('regulated') || 'true');
    localStorage.clear();
    localStorage.setItem('regulated', regulated);
  }

  clearLocalStorage = () => {
    localStorage.clear();
  }

  setLocalStorage = (key: string, value: any) => {
    return localStorage.setItem(key, value);
  }

  getLocalStorage = (key: string) => {
    return localStorage.getItem(key);
  }
}
