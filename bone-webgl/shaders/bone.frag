#version 300 es

precision highp int;
precision highp float;
precision highp usampler2D;

uniform sampler2D state;
uniform usampler2D tex_to_sim_map, neighbors_x, neighbors_y, neighbors_z;
uniform float dt, dcoeff;
uniform float a, b;

in vec2 cc;

layout (location = 0) out vec4 state_out;

void main() {
    ivec2 tex_size = textureSize(state, 0);
    ivec2 my_tex_idx = ivec2(floor(cc * vec2(tex_size)));

    float u = texelFetch(state, my_tex_idx, 0)[0];

    ivec4 nxs = ivec4(texelFetch(neighbors_x, my_tex_idx, 0));
    ivec4 nys = ivec4(texelFetch(neighbors_y, my_tex_idx, 0));
    ivec4 nzs = ivec4(texelFetch(neighbors_z, my_tex_idx, 0));

    float diffusion = texelFetch(state, nxs.xy, 0)[0] + texelFetch(state, nxs.zw, 0)[0]
        + texelFetch(state, nys.xy, 0)[0] + texelFetch(state, nys.zw, 0)[0]
        + texelFetch(state, nzs.xy, 0)[0] + texelFetch(state, nzs.zw, 0)[0]
        - 6.0 * u;

    u += dt * (dcoeff*diffusion - a*u*(u-b)*(u-1.0));

    state_out = vec4(u);
}
