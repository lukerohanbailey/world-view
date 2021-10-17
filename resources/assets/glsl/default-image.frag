precision highp float;

varying vec2 vUv;

uniform sampler2D u_texture;

void main() {
    vec2 uv = vUv;
    vec4 texColor = texture2D(u_texture, uv);
	gl_FragColor = texColor;
}