#version 300 es

precision highp float;
precision highp int;
precision highp usampler2D;

uniform sampler2D state;
uniform usampler2D tex_to_sim_map;
uniform float u_min, u_max;
uniform int tex_width_exp;
uniform vec3 cell_size;
uniform mat4 view_projection_matrix;
uniform float normalized_display_threshold;

in vec3 position;

out vec4 color;

const vec3 norm_front = vec3(0.0, 0.0, -1.0);
const vec3 norm_back = vec3(0.0, 0.0, 1.0);
const vec3 norm_top = vec3(0.0, 1.0, 0.0);
const vec3 norm_bottom = vec3(0.0, -1.0, 0.0);
const vec3 norm_right = vec3(1.0, 0.0, 0.0);
const vec3 norm_left = vec3(-1.0, 0.0, 0.0);

void main() {
    vec3 norm;
    int faceidx = gl_VertexID % 6;

    switch (faceidx) {
    case 0:
        norm = norm_front;
        break;
    case 1:
        norm = norm_back;
        break;
    case 2:
        norm = norm_top;
        break;
    case 3:
        norm = norm_bottom;
        break;
    case 4:
        norm = norm_right;
        break;
    case 5:
        norm = norm_left;
        break;
    }

    int tex_width_mask = (1 << tex_width_exp) - 1;

    ivec2 state_tex_idx = ivec2(gl_InstanceID & tex_width_mask, gl_InstanceID >> tex_width_exp);
    float u = texelFetch(state, state_tex_idx, 0)[0];

    vec3 cell_offset = cell_size * vec3(texelFetch(tex_to_sim_map, state_tex_idx, 0).xyz) - 0.5;
    vec4 cell_position = vec4((0.5 * position) * cell_size + cell_offset, 1.0);

    float colorval = (u - u_min) / (u_max - u_min);
    float c = 1.0 - 0.9*colorval;

    // Transparency doesn't work as a solution here, so just don't draw vertices with too low of a
    // value.
    // - Why: https://stackoverflow.com/questions/42130719/how-to-set-transparency-properly-in-webgl
    // - Possible solutions: https://www.alecjacobson.com/weblog/2750.html
    color = vec4(c, c, c, 1.0);
    if (colorval > normalized_display_threshold) gl_Position = view_projection_matrix * cell_position;
}
