

export default class ShaderProgram {

  public vertShader: WebGLShader;
  public fragShader: WebGLShader;
  public shaderProgram: WebGLProgram;
  
  public constructor(
    private gl: WebGLRenderingContext,
    private vertSource: string,
    private fragSource: string
  ) {
    this.vertShader = this.createVShader(this.vertSource);
    this.fragShader = this.createFShader(this.fragSource);
    this.shaderProgram = this.createShaderProgram(this.vertShader, this.fragShader);
  }

  public static load(
    gl: WebGLRenderingContext,
    vertUrl: string,
    fragUrl: string
  ): Promise<ShaderProgram> {

    return Promise.all([
      ShaderProgram.loadFile(vertUrl),
      ShaderProgram.loadFile(fragUrl)
    ])
    .then((files: Array<string>) => new ShaderProgram(gl, files[0], files[1]));
  }

  public static loadFile(url: string): Promise<string> {
    return new Promise((resolve) => {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          resolve(xhr.responseText);
        }
      }
      xhr.open('GET', url, true);
      xhr.send(null);
    });
  }

  static createProgramFromScripts(
    gl: WebGLRenderingContext,
    vertSelector: string,
    fragSelector: string
  ): Promise<ShaderProgram>  {

    return Promise.all([
      ShaderProgram.getScript(vertSelector), 
      ShaderProgram.getScript(fragSelector)
    ])
      .then((scripts: Array<string>) => new ShaderProgram(gl, scripts[0], scripts[1]));
  }

  public static getScript(selector: string): Promise<string> {
    return new Promise((resolve) => {
      resolve((document.querySelector(selector) as HTMLElement).innerText);
    });
  }

  public use() {
    this.gl.useProgram(this.shaderProgram);
  }

  public createVShader(vertSource: string) {
    const { gl } = this;
    const shader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(shader, vertSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      throw new Error('Failed to compile shader');
    }
    return shader;
  }

  public createFShader(fragSource: string) {
    const { gl } = this;
    const shader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(shader, fragSource)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      throw new Error('Failed to compile shader');
    }
    return shader;
  }

  createShaderProgram(vertShader: WebGLShader, fragShader: WebGLShader) {
    const { gl } = this;
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      throw new Error('Failed to link program');
    }
    return program;
  }

  getAttribute(attributeName: string) {
    const { gl, shaderProgram } = this;
    return gl.getAttribLocation(shaderProgram, attributeName);
  }

  getUniform(uniformName: string) {
    const { gl, shaderProgram } = this;
    return gl.getUniformLocation(shaderProgram, uniformName);
  }

  getAttributes(attributeNames: Array<string>) {
    const { gl, shaderProgram } = this;
    const attribLocations = [];

    if (!Array.isArray(attributeNames)) {
      throw new Error('attributeNames is not a array.');
    }
    for (let i = 0, len = attributeNames.length; i < len; i++) {
      attribLocations.push(gl.getAttribLocation(shaderProgram, attributeNames[i]));
    }

    return attribLocations;
  }

  getUniforms(uniformNames: Array<string>) {
    const { gl, shaderProgram } = this;
    const uniformLocations = [];

    if (!Array.isArray(uniformNames)) {
      throw new Error('uniformNames is not a array.');
    }
    for (let i = 0, len = uniformNames.length; i < len; i++) {
      uniformLocations.push(gl.getUniformLocation(shaderProgram, uniformNames[i]));
    }

    return uniformLocations;
  }

}