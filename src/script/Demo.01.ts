import * as glMatrix from 'gl-matrix-ts';

import ShaderProgram from "./core/ShaderProgram";
import { BufferInfo } from "./declare";
import { randomRgba, randomRange
       , calculateNormal, normalize } from './tools';

const FACE_VERTEX_SOURCE   = require('../shader/face.vert');
const FACE_FRAGMENT_SOURCE = require('../shader/face.frag');

export default class Demo {

  public player: any;
  public instanceCount: number = 0;
  public gl: WebGL2RenderingContext;
  public shaderProgram: ShaderProgram;
  public buffers: Map<string, BufferInfo> = new Map<string, BufferInfo>();
  public dataset: any = {};
  public config: any = {
    fieldOfView: 45,
    zNear: 0.01,
    zFar: 1000,
    
    polygon: 60,

    cameraPos: glMatrix.vec3.fromValues(0, 0, 100),
    cameraLook: glMatrix.vec3.fromValues(0, 0, 0),
    cameraRotate: glMatrix.vec3.fromValues(45, 0, 0),

    scaling: glMatrix.vec3.fromValues(1.0, 1.0, 1.0),
    translating: glMatrix.vec3.fromValues(0.25, 0.25, 0.25),
  };

  public constructor(public canvas: HTMLCanvasElement) {
    console.log(this);

    this.initGL()
        .createModel()
        .initShaders()
        .then((demo) => {
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
      this.gl = this.canvas.getContext('webgl2') as WebGL2RenderingContext;
    } catch (e) { console.error(e) }

    if ( !this.gl ) {
      console.error('Could not initialise WebGL, sorry :-(');
    }

    return this.setViewport();
  }

  private async initShaders() {
    const { gl } = this;

    this.shaderProgram = await ShaderProgram.load(gl, FACE_VERTEX_SOURCE, FACE_FRAGMENT_SOURCE);

    return this;
  }

  private getVariable() {
    const { gl, shaderProgram } = this;

    const faceAttributeNames: Array<string> = [
      'aVertexPosition',
      'aVertexColor',
      'aInstanceSize',
      'aInstancePosition',
      'aInstanceColor',
    ];
    const faceUniformNames: Array<string> = [
      'uMvpMatrix',
      'uModelMatrix',
      'uNormalMatrix',
    ];

    shaderProgram.getAttributes(faceAttributeNames);
    shaderProgram.getUniforms(faceUniformNames);

    return this;
  }

  private createModel() {
    const { dataset, config } = this;
    const center = { x: 0, y: 0, z: 0 };
    const radius = 1;
    const polygon = config.polygon  || Math.floor(randomRange(4, 50));
    const angle = 360 / polygon;
    const rgbaColor = randomRgba();

    let circle_point_position = [];
    let model_vertex_position = [];
    let model_vertex_color    = [];
    let model_vertex_normal   = [];
    let instance_position     = [];
    let instance_size         = [];
    let instance_color        = [];
    let line_vertex_position  = [];
    let line_instance_color     = [];

    // 圆上每个点 x, y
    for (let i = 0; i <= polygon; i++) {
      let radian = angle * i * Math.PI / 180;
      let x = center.x + radius * Math.cos(radian);
      let y = center.y + radius * Math.sin(radian);
      circle_point_position.push([x, y]);
    }

    for( let i = 0; i < circle_point_position.length - 1; i++ ) {
      // 正多边形
      let top = [
        [...circle_point_position[i], center.z],
        [...circle_point_position[i + 1], center.z],
        [center.x, center.y, center.z],
      ];
      let rgbaColorPolygon = randomRgba();

      line_vertex_position.push(...top[0], ...top[1]);
      model_vertex_position.push(...top[0], ...top[1], ...top[2]);
      model_vertex_normal.push(
        ...normalize(calculateNormal(top[0], top[1], top[2])),
        ...normalize(calculateNormal(top[0], top[1], top[2])),
        ...normalize(calculateNormal(top[0], top[1], top[2])),
      );
      model_vertex_color.push(
        ...rgbaColorPolygon,
        ...rgbaColorPolygon,
        ...rgbaColorPolygon,
      );
    }

    for( let i = -5; i <= Math.abs(-5); i += 2 ) {
      for( let j = -5; j <= Math.abs(-5); j += 2 ) {
        instance_position.push(j, i, randomRange(-5, 5));
        instance_size.push(1.0, 1.0, 1.0);
        instance_color.push(...randomRgba());
        line_instance_color.push(...randomRgba());
        this.instanceCount++;
      }
    }

    console.log(this.instanceCount);

    dataset.model_vertex_position = model_vertex_position;
    dataset.model_vertex_normal   = model_vertex_normal;
    dataset.model_vertex_color    = model_vertex_color;
    dataset.instance_position     = instance_position;
    dataset.instance_size         = instance_size;
    dataset.instance_color        = instance_color;
    dataset.line_vertex_position  = line_vertex_position;
    dataset.line_instance_color   = line_instance_color;

    return this;
  }

  private initBuffers() {
    const { gl, dataset, buffers } = this;
    

    const modelVertexBuffer = gl.createBuffer();
    const modelVertexBufferInfo: BufferInfo = {
      buffer: modelVertexBuffer,
      itemSize: 3,
      numItems: dataset.model_vertex_position.length / 3,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataset.model_vertex_position), gl.STATIC_DRAW);
    buffers.set('modelVertexBuffer', modelVertexBufferInfo);

    const modelColorBuffer = gl.createBuffer();
    const modelColorBufferInfo: BufferInfo = {
      buffer: modelColorBuffer,
      itemSize: 4,
      numItems: dataset.model_vertex_color / 4,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, modelColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataset.model_vertex_color), gl.STATIC_DRAW);
    buffers.set('modelColorBuffer', modelColorBufferInfo);

    const instancePositionBuffer = gl.createBuffer();
    const instancePositionBufferInfo: BufferInfo = {
      buffer: instancePositionBuffer,
      itemSize: 3,
      numItems: dataset.instance_position.length / 3,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataset.instance_position), gl.STATIC_DRAW);
    buffers.set('instancePositionBuffer', instancePositionBufferInfo);

    const instanceSizeBuffer = gl.createBuffer();
    const instanceSizeBufferInfo: BufferInfo = {
      buffer: instanceSizeBuffer,
      itemSize: 3,
      numItems: dataset.instance_size.length / 3,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceSizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataset.instance_size), gl.STATIC_DRAW);
    buffers.set('instanceSizeBuffer', instanceSizeBufferInfo);

    const instanceColorBuffer = gl.createBuffer();
    const instanceColorBufferInfo: BufferInfo = {
      buffer: instanceColorBuffer,
      itemSize: 4,
      numItems: dataset.instance_color.length / 4,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataset.instance_color), gl.STATIC_DRAW);
    buffers.set('instanceColorBuffer', instanceColorBufferInfo);

    const lineVertexBuffer = gl.createBuffer();
    const lineVertexBufferInfo: BufferInfo = {
      buffer: lineVertexBuffer,
      itemSize: 3,
      numItems: dataset.line_vertex_position.length / 3,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataset.line_vertex_position), gl.STATIC_DRAW);
    buffers.set('lineVertexBuffer', lineVertexBufferInfo);

    const lineInstanceColorBuffer = gl.createBuffer();
    const lineInstanceColorBufferInfo: BufferInfo = {
      buffer: lineInstanceColorBuffer,
      itemSize: 4,
      numItems: dataset.line_instance_color.length / 4,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, lineInstanceColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataset.line_instance_color), gl.STATIC_DRAW);
    buffers.set('lineInstanceColorBuffer', lineInstanceColorBufferInfo);

    return this;
  }

  private drawScene(offScreenRender = false) {
    const { gl, config, shaderProgram, buffers } = this;

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

    glMatrix.mat4.scale(modelMatrix, modelMatrix, config.scaling);

    glMatrix.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    glMatrix.mat4.multiply(mvpMatrix, projMatrix, mvMatrix);
    glMatrix.mat4.invert(normalMatrix, mvMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    gl.disable(gl.BLEND);
    gl.enable(this.gl.DEPTH_TEST);
    gl.clearColor(.25, .25, .25, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shaderProgram.use();

    // Alpha blend:  https://wgld.org/s/sample_018/
    gl.enable(gl.BLEND);
    gl.blendEquation( gl.FUNC_ADD );
    gl.blendFunc( gl.DST_COLOR, gl.DST_ALPHA );

    gl.uniformMatrix4fv(shaderProgram.uniformVariables.get('uMvpMatrix'), false, mvpMatrix);
    gl.uniformMatrix4fv(shaderProgram.uniformVariables.get('uModelMatrix'), false,modelMatrix);
    gl.uniformMatrix4fv(shaderProgram.uniformVariables.get('uNormalMatrix'), false,normalMatrix);


    const modelVertexBufferInfo = buffers.get('modelVertexBuffer');
    const aVertexPositionVariable = shaderProgram.attributeVariables.get('aVertexPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBufferInfo.buffer);
    gl.enableVertexAttribArray(aVertexPositionVariable);
    gl.vertexAttribPointer( aVertexPositionVariable, modelVertexBufferInfo.itemSize, gl.FLOAT, false, 0, 0);

    // const modelColorBufferInfo = buffers.get('modelColorBuffer');
    // const aVertexColorVariable = shaderProgram.attributeVariables.get('aVertexColor');
    // gl.bindBuffer(gl.ARRAY_BUFFER, modelColorBufferInfo.buffer);
    // gl.enableVertexAttribArray(aVertexColorVariable);
    // gl.vertexAttribPointer(aVertexColorVariable, modelColorBufferInfo.itemSize, gl.FLOAT, false, 0, 0);

    const instancePositionBufferInfo = buffers.get('instancePositionBuffer');
    const aInstancePositionVariable = shaderProgram.attributeVariables.get('aInstancePosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBufferInfo.buffer);
    gl.enableVertexAttribArray(aInstancePositionVariable);
    gl.vertexAttribPointer(aInstancePositionVariable, instancePositionBufferInfo.itemSize, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aInstancePositionVariable, 1);

    const instanceSizeBufferInfo = buffers.get('instanceSizeBuffer');
    const aInstanceSizeVariable = shaderProgram.attributeVariables.get('aInstanceSize');
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceSizeBufferInfo.buffer);
    gl.enableVertexAttribArray(aInstanceSizeVariable);
    gl.vertexAttribPointer(aInstanceSizeVariable, instanceSizeBufferInfo.itemSize, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aInstanceSizeVariable, 1);

    const instanceColorBufferInfo = buffers.get('instanceColorBuffer');
    const aInstanceColorVariable = shaderProgram.attributeVariables.get('aInstanceColor');
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceColorBufferInfo.buffer);
    gl.enableVertexAttribArray(aInstanceColorVariable);
    gl.vertexAttribPointer(aInstanceColorVariable, instanceColorBufferInfo.itemSize, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aInstanceColorVariable, 1);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, modelVertexBufferInfo.numItems, this.instanceCount || 1);

    const lineVertexBuffer = buffers.get('lineVertexBuffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexBuffer.buffer);
    gl.enableVertexAttribArray(aVertexPositionVariable);
    gl.vertexAttribPointer( aVertexPositionVariable, lineVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBufferInfo.buffer);
    gl.enableVertexAttribArray(aInstancePositionVariable);
    gl.vertexAttribPointer(aInstancePositionVariable, instancePositionBufferInfo.itemSize, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aInstancePositionVariable, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceSizeBufferInfo.buffer);
    gl.enableVertexAttribArray(aInstanceSizeVariable);
    gl.vertexAttribPointer(aInstanceSizeVariable, instanceSizeBufferInfo.itemSize, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aInstanceSizeVariable, 1);

    const lineInstanceColorBuffer = buffers.get('lineInstanceColorBuffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, lineInstanceColorBuffer.buffer);
    gl.enableVertexAttribArray(aInstanceColorVariable);
    gl.vertexAttribPointer(aInstanceColorVariable, lineInstanceColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aInstanceColorVariable, 1);

    // gl.drawArrays(gl.LINES, 0, lineVertexBuffer.numItems);
    gl.drawArraysInstanced(gl.LINES, 0, lineVertexBuffer.numItems, this.instanceCount || 1);
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
    const scalingRatio = 0.0025;
    config.cameraRotate[0] += 0.25;

    // for ( let i = 0, len = config.scaling.length; i < len; i++ ) {
    //   if ( config.scaling[i] >= 0.5 && config.scaling[i] <= 1.0 ) {
    //     config.scaling[i] += scalingRatio;
    //   } else {
    //     config.scaling[i] = 0.5;
    //   }
    // }

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