import { GlHelper } from './gl_helper.js';
import { vec3, vec4, mat3, mat4 } from './libs/gl-matrix/index.js';

class BoneSim {
  constructor(display_canvas) {
    this.display_canvas = display_canvas;
    this.gl_helper = new GlHelper();
  }

  initializeState() {
    const tex_nx = 4096;
    const tex_ny = 4096;
    this.clast_size = 50;

    const state_init = new Float32Array(4*tex_nx*tex_ny);
    const clast_pos_init = new Float32Array(4*this.clast_size);
    const clast_dir_init = new Float32Array(4*this.clast_size);
    const rng_state_init = new Uint32Array(4*this.clast_size);

    for (let i = 0; i < state_init.length; i += 4) {
      state_init[i] = 1;
    }

    for (let i = 0; i < clast_pos_init.length; i += 4) {
      clast_pos_init[i] = Math.random();
      clast_pos_init[i+1] = Math.random();
      clast_pos_init[i+2] = Math.random();

      // To get a uniformly distributed unit vector on a sphere, use uniformly distributed azimuth
      // angle 0 to 2*pi and height -1 to 1.
      const az = Math.random() * 2.0 * Math.PI;
      const y = Math.random() * 2.0 - 1.0;
      const r = Math.sqrt(1.0 - y*y);

      clast_dir_init[i] = r * Math.cos(az);
      clast_dir_init[i+1] = y;
      clast_dir_init[i+2] = -r * Math.sin(az);
    }

    const get_random_int = () => Math.floor(Math.random() * 4294967295);
    for (let i = 0; i < rng_state_init.length; i += 4) {
      rng_state_init[i] = get_random_int();
      rng_state_init[i+1] = get_random_int();
      rng_state_init[i+2] = get_random_int();
      rng_state_init[i+3] = get_random_int();
    }

    const dx = 0.02;
    this.state = {
      uniforms: {
        tex_nx: tex_nx,
        tex_ny: tex_ny,
        sim_nx: 256,
        sim_ny: 256,
        sim_nz: 256,
        dt: 0.05,
        dx: dx,
        // dcoeff: 0.0001 / (dx*dx),
        dcoeff: 0.001 / (dx*dx),
        // a: 0.4,
        a: 0.8,
        b: 0.42,
        tex_width_exp: 12,
        clast_max_rot: Math.PI / 2.0,
        clast_speed: 0.01,
        // clast_radius: 0.01,
        clast_radius: 0.08,
        num_clasts: 20,
        u_min: 0.0,
        u_max: 1.0,
      },
      textures: {
        tex_to_sim_map: this.gl_helper.loadUintTexture(tex_nx, tex_ny, null),
        neighbors_x: this.gl_helper.loadUintTexture(tex_nx, tex_ny, null),
        neighbors_y: this.gl_helper.loadUintTexture(tex_nx, tex_ny, null),
        neighbors_z: this.gl_helper.loadUintTexture(tex_nx, tex_ny, null),
        state: this.gl_helper.loadFloatTexture(tex_nx, tex_ny, state_init),
        state_out: this.gl_helper.loadFloatTexture(tex_nx, tex_ny, null),
        clast_pos: this.gl_helper.loadFloatTexture(this.clast_size, 1, clast_pos_init),
        clast_pos_out: this.gl_helper.loadFloatTexture(this.clast_size, 1, null),
        clast_dir: this.gl_helper.loadFloatTexture(this.clast_size, 1, clast_dir_init),
        clast_dir_out: this.gl_helper.loadFloatTexture(this.clast_size, 1, null),
        rng_state: this.gl_helper.loadUintTexture(this.clast_size, 1, rng_state_init),
        rng_state_out: this.gl_helper.loadUintTexture(this.clast_size, 1, null),
        rng_value: this.gl_helper.loadFloatTexture(this.clast_size, 1, null),
      },
      display: {
        fov: 30,
        view_distance: 5,
        xrot: 0,
        yrot: 0,
      },
    };

    this.state.uniforms.view_projection_matrix = this.getUpdatedVPM();

    this.rotate = false;

    this.display_canvas.addEventListener('mousedown', (e) => {
      if (e.which === 1) {
        this.rotate = true;
        return false;
      }

      return true;
    });

    window.addEventListener('mouseup', (e) => {
      this.rotate = false;
      return true;
    });

    this.display_canvas.addEventListener('mousemove', (e) => {
      if (this.rotate) {
        const xrot = this.state.display.xrot + 0.2 * e.movementY;
        const yrot = this.state.display.yrot - 0.2 * e.movementX;
        this.state.display.xrot = ((xrot % 360) + 360) % 360;
        this.state.display.yrot = ((yrot % 360) + 360) % 360;
        this.state.uniforms.view_projection_matrix = this.getUpdatedVPM();

        return false;
      }

      return true;
    });
  }

  async createPrograms() {
    const load_shader_text = (path) => fetch(path).then((resp) => resp.text());

    const default_vertex_shader = await load_shader_text('./shaders/default.vert');
    const copy_float_fragment_shader = await load_shader_text('./shaders/copy_float.frag');
    const copy_uint_fragment_shader = await load_shader_text('./shaders/copy_uint.frag');

    this.programs = {};

    this.programs.tex_to_sim_map = this.gl_helper.createProgram(
      default_vertex_shader,
      await load_shader_text('./shaders/tex_to_sim_map.frag'),
      [
        ['tex_width', '1i', (state) => state.uniforms.tex_nx],
        ['tex_height', '1i', (state) => state.uniforms.tex_ny],
        ['sim_nx', '1i', (state) => state.uniforms.sim_nx],
        ['sim_ny', '1i', (state) => state.uniforms.sim_ny],
        ['sim_nz', '1i', (state) => state.uniforms.sim_nz],
      ],
      (state) => [this.state.textures.tex_to_sim_map],
      [this.state.uniforms.tex_nx, this.state.uniforms.tex_ny],
    );

    this.programs.neighbor_map = this.gl_helper.createProgram(
      default_vertex_shader,
      await load_shader_text('./shaders/neighbor_map.frag'),
      [
        ['tex_to_sim_map', 'tex', (state) => state.textures.tex_to_sim_map],
        ['sim_nx', '1i', (state) => state.uniforms.sim_nx],
        ['sim_ny', '1i', (state) => state.uniforms.sim_ny],
        ['sim_nz', '1i', (state) => state.uniforms.sim_nz],
      ],
      (state) => [this.state.textures.neighbors_x, this.state.textures.neighbors_y, this.state.textures.neighbors_z],
      [this.state.uniforms.tex_nx, this.state.uniforms.tex_ny],
    );

    this.programs.bone = this.gl_helper.createProgram(
      default_vertex_shader,
      await load_shader_text('./shaders/bone.frag'),
      [
        ['state', 'tex', (state) => state.textures.state],
        ['tex_to_sim_map', 'tex', (state) => state.textures.tex_to_sim_map],
        ['neighbors_x', 'tex', (state) => state.textures.neighbors_x],
        ['neighbors_y', 'tex', (state) => state.textures.neighbors_y],
        ['neighbors_z', 'tex', (state) => state.textures.neighbors_z],
        ['dt', '1f', (state) => state.uniforms.dt],
        ['dcoeff', '1f', (state) => state.uniforms.dcoeff],
        ['a', '1f', (state) => state.uniforms.a],
        ['b', '1f', (state) => state.uniforms.b],
      ],
      (state) => [state.textures.state_out],
      [this.state.uniforms.tex_nx, this.state.uniforms.tex_ny],
    );

    this.programs.eat = this.gl_helper.createProgram(
      default_vertex_shader,
      await load_shader_text('./shaders/eat.frag'),
      [
        ['state', 'tex', (state) => state.textures.state_out],
        ['clast_pos', 'tex', (state) => state.textures.clast_pos],
        ['tex_to_sim_map', 'tex', (state) => state.textures.tex_to_sim_map],
        ['clast_radius', '1f', (state) => state.uniforms.clast_radius],
        ['num_clasts', '1i', (state) => state.uniforms.num_clasts],
        ['bounds', 'vec3', (state) => [state.uniforms.sim_nx, state.uniforms.sim_ny, state.uniforms.sim_nz]],
      ],
      (state) => [state.textures.state],
      [this.state.uniforms.tex_nx, this.state.uniforms.tex_ny],
    );

    this.programs.clast_move = this.gl_helper.createProgram(
      default_vertex_shader,
      await load_shader_text('./shaders/clast_move.frag'),
      [
        ['clast_pos', 'tex', (state) => state.textures.clast_pos],
        ['clast_dir', 'tex', (state) => state.textures.clast_dir],
        ['rng_value', 'tex', (state) => state.textures.rng_value],
        ['clast_max_rot', '1f', (state) => state.uniforms.clast_max_rot],
        ['clast_speed', '1f', (state) => state.uniforms.clast_speed],
        ['num_clasts', '1i', (state) => state.uniforms.num_clasts],
      ],
      (state) => [state.textures.clast_pos_out, state.textures.clast_dir_out],
      [this.clast_size, 1],
    );

    this.programs.rng = this.gl_helper.createProgram(
      default_vertex_shader,
      await load_shader_text('./shaders/pcg.frag'),
      [
        ['random_state_in', 'tex', (state) => state.textures.rng_state],
      ],
      (state) => [state.textures.rng_state_out, state.textures.rng_value],
      [this.clast_size, 1],
    );

    this.programs.copy_clast_pos = this.gl_helper.createProgram(
      default_vertex_shader,
      copy_float_fragment_shader,
      [
        ['original', 'tex', (state) => state.textures.clast_pos_out],
      ],
      (state) => [state.textures.clast_pos],
      [this.clast_size, 1],
    );

    this.programs.copy_clast_dir = this.gl_helper.createProgram(
      default_vertex_shader,
      copy_float_fragment_shader,
      [
        ['original', 'tex', (state) => state.textures.clast_dir_out],
      ],
      (state) => [state.textures.clast_dir],
      [this.clast_size, 1],
    );

    this.programs.copy_rng = this.gl_helper.createProgram(
      default_vertex_shader,
      copy_uint_fragment_shader,
      [
        ['original', 'tex', (state) => state.textures.rng_state_out],
      ],
      (state) => [state.textures.rng_state],
      [this.clast_size, 1],
    );

    this.programs.display = this.gl_helper.createDisplay(
      await load_shader_text('./shaders/display.vert'),
      await load_shader_text('./shaders/display.frag'),
      [
        ['state', 'tex', (state) => state.textures.state],
        ['tex_to_sim_map', 'tex', (state) => state.textures.tex_to_sim_map],
        ['view_projection_matrix', 'mat4', (state) => state.uniforms.view_projection_matrix],
        ['u_min', '1f', (state) => state.uniforms.u_min],
        ['u_max', '1f', (state) => state.uniforms.u_max],
        ['tex_width_exp', '1i', (state) => state.uniforms.tex_width_exp],
        ['cell_size', 'vec3', (state) => [1.0 / state.uniforms.sim_nx, 1.0 / state.uniforms.sim_ny, 1.0 / state.uniforms.sim_nz]],
      ],
      this.display_canvas,
    );
  }

  runSimulationInit() {
    this.programs.tex_to_sim_map(this.state);
    this.programs.neighbor_map(this.state);
  }

  runSimulation() {
    // const a = new Float32Array(this.state.uniforms.tex_nx * this.state.uniforms.tex_ny / 4);
    // const a = new Float32Array(this.clast_size * 4);

    this.programs.rng(this.state);
    this.programs.copy_rng(this.state);
    this.programs.bone(this.state);
    this.programs.eat(this.state);
    // this.gl_helper.getFloatTextureArray(this.state.textures.state, this.state.uniforms.tex_nx / 4, this.state.uniforms.tex_ny / 4, a);
    this.programs.clast_move(this.state);
    this.programs.copy_clast_pos(this.state);
    this.programs.copy_clast_dir(this.state);
    // this.gl_helper.getFloatTextureArray(this.state.textures.clast_dir_out, this.clast_size, 1, a);

    // console.log(a);
  }

  runDisplay() {
    this.programs.display(this.state);
  }

  getProjectionMatrix(fovdeg, near, far) {
    const fov = fovdeg * Math.PI / 180.0;
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeinv = 1.0 / (near - far);

    return mat4.fromValues(
      f, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeinv, -1,
      0, 0, near * far * rangeinv * 2, 0,
    );
  }

  getViewMatrix(dist, xrotdeg, yrotdeg) {
    // Convert degrees to radians
    const xrot = xrotdeg * Math.PI / 180.0;
    const yrot = yrotdeg * Math.PI / 180.0;

    // Get the values used as entries in the rotation matrices
    const cx = Math.cos(xrot);
    const sx = Math.sin(xrot);
    const cy = Math.cos(yrot);
    const sy = Math.sin(yrot);

    // Storage needed for matrix operations.
    const xrot_mat3 = mat3.create();
    const yrot_mat3 = mat3.create();
    const m1 = mat4.create();
    const v1 = vec3.create();
    const v2 = vec3.create();
    const view_matrix = mat4.create();
    const cam_pos = vec3.create();

    // Rotation matrix about the x-axis
    const xrot_mat = mat4.fromValues(
      1, 0, 0, 0,
      0, cx, sx, 0,
      0, -sx, cx, 0,
      0, 0, 0, 1,
    );

    // Rotation matrix about the y-axis
    const yrot_mat = mat4.fromValues(
      cy, 0, sy, 0,
      0, 1, 0, 0,
      -sy, 0, cy, 0,
      0, 0, 0, 1,
    );

    // The center of the simulation. The camera offset is relative to this position.
    const sim_center = vec3.fromValues(0, 0, 0);

    // The default camera offset before rotation.
    const cam_offset = vec3.fromValues(
      0,
      0,
      -dist,
    );

    // Create 3x3 versions of the rotation matrices.
    mat3.fromMat4(xrot_mat3, xrot_mat);
    mat3.fromMat4(yrot_mat3, yrot_mat);

    // Apply rotations to the camera offset.
    vec3.transformMat3(v1, cam_offset, xrot_mat3);
    vec3.transformMat3(v2, v1, yrot_mat3);
    // Add the camera offset to the simulation center to get the camera position.
    vec3.add(cam_pos, sim_center, v2);

    // The matrix that places the region in the correct offset relative to the camera is
    //
    // 1  0  0 -cam_pos[0]
    // 0  1  0 -cam_pos[1]
    // 0  0 -1  cam_pos[2]
    // 0  0  0  1
    //
    // This matrix first flips the z-axis so higher z-values are farther from the camera. It then
    // translates the region so it is centered about the origin.
    const offset_mat = mat4.fromValues(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, -1, 0,
      -cam_pos[0], -cam_pos[1], cam_pos[2], 1,
    );

    // Apply the rotations to the offset matrix.
    mat4.multiply(m1, yrot_mat, offset_mat);
    mat4.multiply(view_matrix, xrot_mat, m1);

    return view_matrix;
  }

  getViewProjectionMatrix(fov, view_distance, max_distance, xrot, yrot) {
    // If near = 0 then the depth test doesn't work. Why?
    const projection_matrix = this.getProjectionMatrix(fov, 1, max_distance);
    const view_matrix = this.getViewMatrix(view_distance, xrot, yrot);
    const view_projection_matrix = mat4.create();
    mat4.multiply(view_projection_matrix, projection_matrix, view_matrix);

    return view_projection_matrix;
  }

  getUpdatedVPM() {
    return this.getViewProjectionMatrix(
      this.state.display.fov,
      this.state.display.view_distance,
      100,
      this.state.display.xrot,
      this.state.display.yrot,
    );
  }
};

export { BoneSim };
