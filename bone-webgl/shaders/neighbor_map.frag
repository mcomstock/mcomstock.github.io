#version 300 es

precision highp float;
precision highp int;
precision highp usampler2D;

uniform usampler2D tex_to_sim_map;
uniform int sim_nx, sim_ny, sim_nz;

in vec2 cc;

layout (location = 0) out uvec4 neighbors_x;
layout (location = 1) out uvec4 neighbors_y;
layout (location = 2) out uvec4 neighbors_z;

void main() {
    ivec2 tex_size = textureSize(tex_to_sim_map, 0);
    ivec2 my_tex_idx = ivec2(floor(cc * vec2(tex_size)));

    ivec3 my_sim_idx = ivec3(texelFetch(tex_to_sim_map, my_tex_idx, 0).xyz);
    ivec3 my_sim_idx_components = ivec3(my_sim_idx[0], my_sim_idx[1] * sim_nx, my_sim_idx[2] * sim_nx * sim_ny);

    if (sim_nx > 0) {
        int x_next = my_sim_idx[0] == sim_nx - 1 ? my_sim_idx[0] - 1 : my_sim_idx[0] + 1;
        int x_prev = my_sim_idx[0] == 0 ? my_sim_idx[0] + 1 : my_sim_idx[0] - 1;

        int x_next_idx = x_next + my_sim_idx_components[1] + my_sim_idx_components[2];
        int x_prev_idx = x_prev + my_sim_idx_components[1] + my_sim_idx_components[2];

        ivec2 x_next_tex_idx = ivec2(x_next_idx % tex_size[0], x_next_idx / tex_size[0]);
        ivec2 x_prev_tex_idx = ivec2(x_prev_idx % tex_size[0], x_prev_idx / tex_size[0]);

        neighbors_x = uvec4(x_next_tex_idx, x_prev_tex_idx);
    } else {
        neighbors_x = uvec4(my_tex_idx, my_tex_idx);
    }

    if (sim_ny > 0) {
        int y_next = my_sim_idx[1] == sim_ny - 1 ? my_sim_idx[1] - 1 : my_sim_idx[1] + 1;
        int y_prev = my_sim_idx[1] == 0 ? my_sim_idx[1] + 1 : my_sim_idx[1] - 1;

        int y_next_idx = my_sim_idx_components[0] + y_next * sim_nx + my_sim_idx_components[2];
        int y_prev_idx = my_sim_idx_components[0] + y_prev * sim_nx + my_sim_idx_components[2];

        ivec2 y_next_tex_idx = ivec2(y_next_idx % tex_size[0], y_next_idx / tex_size[0]);
        ivec2 y_prev_tex_idx = ivec2(y_prev_idx % tex_size[0], y_prev_idx / tex_size[0]);

        neighbors_y = uvec4(y_next_tex_idx, y_prev_tex_idx);
    } else {
        neighbors_y = uvec4(my_tex_idx, my_tex_idx);
    }

    if (sim_nz > 0) {
        int z_next = my_sim_idx[2] == sim_nz - 1 ? my_sim_idx[2] - 1 : my_sim_idx[2] + 1;
        int z_prev = my_sim_idx[2] == 0 ? my_sim_idx[2] + 1 : my_sim_idx[2] - 1;

        int z_next_idx = my_sim_idx_components[0] + my_sim_idx_components[1] + z_next * sim_nx * sim_ny;
        int z_prev_idx = my_sim_idx_components[0] + my_sim_idx_components[1] + z_prev * sim_nx * sim_ny;

        ivec2 z_next_tex_idx = ivec2(z_next_idx % tex_size[0], z_next_idx / tex_size[0]);
        ivec2 z_prev_tex_idx = ivec2(z_prev_idx % tex_size[0], z_prev_idx / tex_size[0]);

        neighbors_z = uvec4(z_next_tex_idx, z_prev_tex_idx);
    } else {
        neighbors_z = uvec4(my_tex_idx, my_tex_idx);
    }
}
