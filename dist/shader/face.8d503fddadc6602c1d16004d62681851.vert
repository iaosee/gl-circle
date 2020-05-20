precision mediump float;
precision mediump int;

attribute vec4 aVertexColor;
attribute vec3 aVertexPosition;
attribute vec3 aInstanceSize;
attribute vec3 aInstancePosition;
attribute vec4 aInstanceColor;

uniform mat4 uMvpMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;

varying vec4 vColor;

void main() {
  gl_Position = uMvpMatrix * vec4(aVertexPosition * aInstanceSize + aInstancePosition, 1.0);
  // vColor = aVertexColor;
  vColor = aInstanceColor;
}
