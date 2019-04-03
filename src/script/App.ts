
export default class App {

  public canvas: HTMLCanvasElement;
  public static instance: App;

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
    };
    setSize();
    document.body.appendChild(this.canvas);
    window.addEventListener('resize', setSize, false);

  }

}
