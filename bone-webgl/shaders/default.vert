#version 300 es

precision highp float;
precision highp int;

in vec3 position;

out vec2 cc;
out vec3 pixCrd;
flat out int instanceID;

void main() {
    cc = position.xy;
    pixCrd = position.xyz;
    instanceID = gl_InstanceID;
    gl_Position = vec4(position.xy * 2.0 - 1.0, 0.0, 1.0);
}
