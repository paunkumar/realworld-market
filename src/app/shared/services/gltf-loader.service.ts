import { Injectable } from '@angular/core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Injectable({
  providedIn: 'root'
})
export class GltfLoaderService {
  private loader: GLTFLoader;


  constructor() {
    this.loader = new GLTFLoader();
  }

  loadModel(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.load(url, resolve, undefined, reject);
    });
  }
}
