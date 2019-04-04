import * as glMatrix from 'gl-matrix-ts';

import ShaderProgram from "./core/ShaderProgram";
import { BufferInfo } from "./declare";

const FACE_VERTEX_SOURCE   = require('../shader/face.vert');
const FACE_FRAGMENT_SOURCE = require('../shader/face.frag');
const LINE_VERTEX_SOURCE   = require('../shader/line.vert');
const LINE_FRAGMENT_SOURCE = require('../shader/line.frag');

const randomRgba = () => [Math.random(), Math.random(), Math.random(), 1.0];

export default class Demo {

  public player: any;
  public gl: WebGLRenderingContext;
  public faceProgram: ShaderProgram;
  public lineProgram: ShaderProgram;
  public buffers: Map<string, BufferInfo> = new Map<string, BufferInfo>();
  public config: any = {
    fieldOfView: 45,
    zNear: 0.01,
    zFar: 1000,

    cameraPos: [0, 0, 20],
    cameraLook: [0, 0, 7],
    cameraRotate: [0, 0, 0],

  };

  public constructor(public canvas: HTMLCanvasElement) {

    this.initGL()
        .initShaders()
        .then((demo) => {
          console.log(demo);
          this.getVariable()
              .initBuffers()
              .listenEvents()
              .start();
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

  private getVariable() {
    const { gl, faceProgram, lineProgram } = this;

    const faceAttributeNames: Array<string> = [
      'aVertexPosition',
      'aVertexColor',
    ];
    const faceUniformNames: Array<string> = [
      'uMvpMatrix',
      'uModelMatrix',
      'uNormalMatrix',
    ];

    faceProgram.getAttributes(faceAttributeNames);
    faceProgram.getUniforms(faceUniformNames);

    return this;
  }

  private initBuffers() {
    const { gl, buffers } = this;
    const model_vertex_positios: Array<number> = [
      // Front face
      -0.5, -0.5,  0.5,
      0.5, -0.5,  0.5,
      0.5,  0.5,  0.5,
      -0.5,  0.5,  0.5,
      // Back face
      -0.5, -0.5, -0.5,
      -0.5,  0.5, -0.5,
      0.5,  0.5, -0.5,
      0.5, -0.5, -0.5,
      // Top face
      -0.5,  0.5, -0.5,
      -0.5,  0.5,  0.5,
      0.5,  0.5,  0.5,
      0.5,  0.5, -0.5,
      // Bottom face
      -0.5, -0.5, -0.5,
      0.5, -0.5, -0.5,
      0.5, -0.5,  0.5,
      -0.5, -0.5,  0.5,
      // Right face
      0.5, -0.5, -0.5,
      0.5,  0.5, -0.5,
      0.5,  0.5,  0.5,
      0.5, -0.5,  0.5,
      // Left face
      -0.5, -0.5, -0.5,
      -0.5, -0.5,  0.5,
      -0.5,  0.5,  0.5,
      -0.5,  0.5, -0.5,
    ];
    let model_vertex_colors: Array<number> = [];
    const faceColors = [
      [...randomRgba()],    // Front face: white
      [...randomRgba()],    // Back face: red
      [...randomRgba()],    // Top face: green
      [...randomRgba()],    // Bottom face: blue
      [...randomRgba()],    // Right face: yellow
      [...randomRgba()],    // Left face: purple
    ];
    for( let i = 0; i < faceColors.length; ++i ) {
      let c = faceColors[i];
      model_vertex_colors = model_vertex_colors.concat(c, c, c, c);
    }
    const model_vertex_indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];

    console.log(model_vertex_positios);
    console.log(model_vertex_colors);
    console.log(model_vertex_indices);

    const positionBuffer = gl.createBuffer();
    const positionBufferInfo: BufferInfo = {
      buffer: positionBuffer,
      itemSize: 3,
      numItems: model_vertex_positios.length / 3,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_vertex_positios), gl.STATIC_DRAW);
    buffers.set('positionBuffer', positionBufferInfo);


    const colorBuffer = gl.createBuffer();
    const colorBufferInfo: BufferInfo = {
      buffer: colorBuffer,
      itemSize: 4,
      numItems: model_vertex_colors.length / 4,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_vertex_colors), gl.STATIC_DRAW);
    buffers.set('colorBuffer', colorBufferInfo);

    const indexBuffer = gl.createBuffer();
    const indexBufferInfo: BufferInfo = {
      buffer: indexBuffer,
      itemSize: 1,
      numItems: model_vertex_indices.length / 1,
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model_vertex_indices), gl.STATIC_DRAW);
    buffers.set('indexBuffer', indexBufferInfo);

    return this;
  }

  private drawScene(offScreenRender = false) {
    const { gl, config, faceProgram, lineProgram, buffers } = this;
    
    const fieldOfView = config.fieldOfView / Math.PI / 180;
    const aspect      = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const zNear       = config.zNear;
    const zFar        = config.zFar;

    const modelMatrix  = glMatrix.mat4.create();
    const viewMatrix   = glMatrix.mat4.create();
    const projMatrix   = glMatrix.mat4.create();
    const mvpMatrix    = glMatrix.mat4.create();
    const normalMatrix = glMatrix.mat4.create();
    const mvMatrix     = glMatrix.mat4.create();

    glMatrix.mat4.perspective(projMatrix, fieldOfView, aspect, zNear, zFar);
    glMatrix.mat4.lookAt(viewMatrix, config.cameraPos, config.cameraLook, [0, 1, 0]);
    glMatrix.mat4.rotate(modelMatrix, modelMatrix, config.cameraRotate[0] * Math.PI / 180, [1, 0, 0]);
    glMatrix.mat4.rotate(modelMatrix, modelMatrix, config.cameraRotate[1] * Math.PI / 180, [0, 1, 0]);
    glMatrix.mat4.rotate(modelMatrix, modelMatrix, config.cameraRotate[2] * Math.PI / 180, [0, 0, 1]);

    glMatrix.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    glMatrix.mat4.multiply(mvpMatrix, projMatrix, mvMatrix);
    glMatrix.mat4.invert(normalMatrix, mvMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    gl.disable(gl.BLEND);
    gl.enable(this.gl.DEPTH_TEST);
    gl.clearColor(.25, .25, .25, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    faceProgram.use();
    gl.uniformMatrix4fv(faceProgram.uniformVariables.get('uMvpMatrix'), false, mvpMatrix);
    gl.uniformMatrix4fv(faceProgram.uniformVariables.get('uModelMatrix'), false,modelMatrix);
    gl.uniformMatrix4fv(faceProgram.uniformVariables.get('uNormalMatrix'), false,normalMatrix);

    const positionBufferInfo = buffers.get('positionBuffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferInfo.buffer);
    gl.enableVertexAttribArray(faceProgram.attributeVariables.get('aVertexPosition'));
    gl.vertexAttribPointer(
      faceProgram.attributeVariables.get('aVertexPosition'),
      positionBufferInfo.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    const colorBufferInfo = buffers.get('colorBuffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferInfo.buffer);
    gl.enableVertexAttribArray(faceProgram.attributeVariables.get('aVertexColor'));
    gl.vertexAttribPointer(
      faceProgram.attributeVariables.get('aVertexColor'),
      colorBufferInfo.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    (gl as any).drawArraysInstanced(gl.TRIANGLES, 0, positionBufferInfo.numItems, 1);

  }

  private clickItemHandler() {
    return (e: MouseEvent) => {
      console.log(e);
    }
  }

  listenEvents() {
    const { canvas, config } = this;
    const _this = this;
    const mouse = {
      dragging: false,
      lastMouseX: -1,
      lastMouseY: -1,
      keyStep: 0.1,
    };

    canvas.addEventListener('mousedown', this.clickItemHandler(), false);
    document.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());
    canvas.addEventListener('mousewheel', mouseWheelHandler, false);
    canvas.addEventListener('mousedown', mouseDownHandler, false);
    document.addEventListener('mousemove', mouseMoveHandler, false);
    document.addEventListener('mouseup', mouseUpHandler, false);
    canvas.addEventListener('touchstart', mouseDownHandler, false);
    document.addEventListener('touchmove', mouseMoveHandler, false);
    document.addEventListener('touchend', mouseUpHandler, false);
    document.addEventListener('keydown', keyDownHandler, false);
    canvas.addEventListener('webglcontextlost', contextLostHandler, false);
    canvas.addEventListener('webglcontextrestored', contextRestoredHandler, false);

    function mouseWheelHandler(e: MouseWheelEvent) {
      let z = e.deltaY / canvas.height * 10;
      config.cameraPos[2] += z;
      config.cameraLook[2] += z;

      // console.log(config.cameraPos, config.cameraLook);
    }

    function mouseDownHandler(e: MouseEvent) {
      let x = e.clientX,
        y = e.clientY;
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        mouse.lastMouseX = x;
        mouse.lastMouseY = y;
        mouse.dragging = true;
      }
      e.preventDefault && e.preventDefault();
    }

    function mouseMoveHandler(e: MouseEvent) {
      let x = e.clientX,
        y = e.clientY;
      if (mouse.dragging) {
        let factor = 100 / canvas.height;
        let dx = factor * (x - mouse.lastMouseX);
        let dy = factor * (y - mouse.lastMouseY);
        // config.cameraRotate[0] = Math.max(Math.min(config.cameraRotate[0] + dy, 180.0), -180.0);
        // console.log(e.ctrlKey);
        if (e.ctrlKey) {
          config.cameraPos[0] -= dx / 100;
          config.cameraPos[1] += dy / 100;
          config.cameraLook[0] -= dx / 100;
          config.cameraLook[1] += dy / 100;
        } else {
          config.cameraRotate[0] += dy;
          config.cameraRotate[1] += dx;
        }
      }
      mouse.lastMouseX = x;
      mouse.lastMouseY = y;
      e.preventDefault && e.preventDefault();
    }

    function mouseUpHandler(e: MouseEvent) {
      mouse.dragging = false;
      e.preventDefault && e.preventDefault();
    }

    function keyDownHandler(e: KeyboardEvent) {
      switch (e.keyCode) {
        case 87: //up
        case 38:
          config.cameraPos[2] -= mouse.keyStep;
          config.cameraLook[2] -= mouse.keyStep;
          break;
        case 83: // down
        case 40:
          config.cameraPos[2] += mouse.keyStep;
          config.cameraLook[2] += mouse.keyStep;
          break;
        case 65: // left
        case 37:
          config.cameraPos[0] -= mouse.keyStep;
          config.cameraLook[0] -= mouse.keyStep;
          break;
        case 68: // right
        case 39:
          config.cameraPos[0] += mouse.keyStep;
          config.cameraLook[0] += mouse.keyStep;
          break;
        case 32:
          console.log('restoration');
          break;
      }
    }

    function contextLostHandler(e: MouseEvent) {
      console.log('contextLost');
      e.preventDefault();
      _this.stopPlay();
    }

    function contextRestoredHandler(e: MouseEvent) {
      console.log('contextRestored');
      e.preventDefault();
    }

    return this;
  }

  private update(deltaTime: number) {
    const { config } = this;
    config.cameraRotate[1] += deltaTime;

    return this;
  }

  private startPlay() {
    let then: number = 0;

    const tick = (now: number) => {
      let deltaTime: number = now - then;
      then = now;
      deltaTime *= 0.001;

      this.update(deltaTime);
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