precision mediump float;
precision mediump int;

attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uMvpMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;

varying vec4 vColor;

void main() {
  gl_Position = uMvpMatrix * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
}
