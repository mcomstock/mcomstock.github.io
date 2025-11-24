#version 300 es

precision highp int;
precision highp float;

uniform int tex_width, tex_height, sim_nx, sim_ny, sim_nz;

in vec2 cc;

layout (location = 0) out uvec4 tex_to_sim_map;

void main() {
    ivec2 my_tex_idx = ivec2(floor(cc * vec2(tex_width, tex_height)));
    int my_idx = my_tex_idx[0] + my_tex_idx[1] * tex_width;

    tex_to_sim_map = uvec4(my_idx % sim_nx, (my_idx / sim_nx) % sim_ny, my_idx / (sim_nx * sim_ny), 0);
}
