
import Demo from './Demo.01';

export default class App {

  public canvas: HTMLCanvasElement;
  public static instance: App;
  public demo: Demo;

  public constructor() {

  }

  static init() {
    return App.instance ? App.instance : App.instance = new App();
  }

  run() {

    this.canvas = document.createElement('canvas');
    const setSize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.demo && this.demo.setViewport();
    };
    setSize();
    document.body.appendChild(this.canvas);
    window.addEventListener('resize', setSize, false);

    this.demo = Demo.init(this.canvas);
    (window as any).demo = this.demo;
  }

}
