#version 300 es

precision highp int;
precision highp float;

uniform sampler2D clast_pos, clast_dir, rng_value;
uniform float clast_max_rot, clast_speed;
uniform int num_clasts;

in vec2 cc;

layout (location = 0) out vec4 clast_pos_out;
layout (location = 1) out vec4 clast_dir_out;

const float TWOPI = 8.0 * atan(1.0);

void main() {
    ivec2 tex_size = textureSize(clast_pos, 0);
    ivec2 my_tex_idx = ivec2(floor(cc * vec2(tex_size)));

    vec3 my_pos = texelFetch(clast_pos, my_tex_idx, 0).xyz;
    vec3 my_dir = texelFetch(clast_dir, my_tex_idx, 0).xyz;

    vec4 rand = texelFetch(rng_value, my_tex_idx, 0);

    if (my_tex_idx[0] < num_clasts) {
        /*
         * Compute a uniformly distributed unit vector with maximum angular offset (given by
         * clast_max_rot). First compute angular offset from z-axis, then rotate it to align with
         * the old position.
         */

        // Arbitrary vector not parallel to original direction
        vec3 a = abs(my_dir[0]) < 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        // Rescale just in case
        vec3 uz = normalize(my_dir);
        vec3 ux = normalize(cross(a, uz));
        vec3 uy = normalize(cross(uz, ux));
        // Rotation matrix to change offset from z-axis to offset from original direction
        mat3 m = mat3(ux, uy, uz);

        // Get offset from z-axis
        float phi = sqrt(rand[0]) * clast_max_rot;
        float theta = rand[1] * TWOPI;
        vec3 offset = vec3(cos(theta) * sin(phi), sin(theta) * sin(phi), cos(phi));

        my_dir = m * offset;

        // TODO update before direction?
        my_pos += clast_speed * my_dir;

        // TODO handle walls better
        if (my_pos[0] > 1.0) my_pos[0] = 1.0; else if (my_pos[0] < 0.0) my_pos[0] = 0.0;
        if (my_pos[1] > 1.0) my_pos[1] = 1.0; else if (my_pos[1] < 0.0) my_pos[1] = 0.0;
        if (my_pos[2] > 1.0) my_pos[2] = 1.0; else if (my_pos[2] < 0.0) my_pos[2] = 0.0;

        // my_dir = vec3(0.0);
        // my_pos = vec3(0.0);
    }

    clast_pos_out = vec4(my_pos, 0.0);
    clast_dir_out = vec4(my_dir, 0.0);
}
