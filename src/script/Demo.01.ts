import ShaderProgram from "./core/ShaderProgram";

const FACE_VERTEX_SOURCE   = require('../shader/face.vert');
const FACE_FRAGMENT_SOURCE = require('../shader/face.frag');
const LINE_VERTEX_SOURCE   = require('../shader/line.vert');
const LINE_FRAGMENT_SOURCE = require('../shader/line.frag');

export default class Demo {

  public player: any;
  public gl: WebGLRenderingContext;
  public faceProgram: ShaderProgram;
  public lineProgram: ShaderProgram;

  public constructor(public canvas: HTMLCanvasElement) {

    this.initGL()
        .initShaders()
        .then((demo) => {
          console.log(demo);
          this.start();
        });
  }

  public static init(canvas: HTMLCanvasElement) {
    return new Demo(canvas);
  }

  public start() {
    return this.startPlay();
  }

  public stop() {
    return this.stopPlay();
  }

  public setViewport() {
    const { gl } = this;

    gl.viewport(
      0, 
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    );

    return this;
  }

  private initGL() {

    try {
      this.gl = (this.canvas.getContext('webgl2') as WebGLRenderingContext);
    } catch (e) { console.error(e) }

    if ( !this.gl ) {
      console.error('Could not initialise WebGL, sorry :-(');
    }

    return this.setViewport();
  }

  private async initShaders() {
    const { gl } = this;

    this.faceProgram = await ShaderProgram.load(gl, FACE_VERTEX_SOURCE, FACE_FRAGMENT_SOURCE);
    this.lineProgram = await ShaderProgram.load(gl, LINE_VERTEX_SOURCE, LINE_FRAGMENT_SOURCE);

    return this;
  }

  private drawScene() {
    // console.log('drawScene');
  }

  private startPlay() {
    let then = 0;

    const tick = (now: number) => {
      let deltaTime = now - then;
      then = now;
      deltaTime *= 0.001;

      this.drawScene();
      this.player = requestAnimationFrame(tick);
    }

    this.player && this.stopPlay();
    this.player = requestAnimationFrame(tick);
    return this;
  }

  private stopPlay() {
    this.player && cancelAnimationFrame(this.player);
    return this;
  }


}