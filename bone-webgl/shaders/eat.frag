#version 300 es

precision highp int;
precision highp float;
precision highp usampler2D;

uniform sampler2D state, clast_pos;
uniform usampler2D tex_to_sim_map;
uniform float clast_radius;
uniform int num_clasts;
uniform vec3 bounds;

in vec2 cc;

layout (location = 0) out vec4 state_out;

void main() {
    ivec2 tex_size = textureSize(state, 0);
    ivec2 my_tex_idx = ivec2(floor(cc * vec2(tex_size)));

    vec3 my_sim_idx = vec3(texelFetch(tex_to_sim_map, my_tex_idx, 0).xyz);

    // TODO probably should figure out actual units here
    vec3 my_sim_pos = my_sim_idx / bounds;

    float u = texelFetch(state, my_tex_idx, 0)[0];

    for (int i = 0; i < num_clasts; ++i) {
        vec3 pos = texelFetch(clast_pos, ivec2(i, 0), 0).xyz;
        if (distance(my_sim_pos, pos) < clast_radius) {
            u = 0.0;
            break;
        }
    }

    state_out = vec4(u);
}
