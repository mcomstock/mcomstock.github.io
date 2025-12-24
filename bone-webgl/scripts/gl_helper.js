class GlHelper {
  constructor() {
    this.canvas = document.createElement('canvas');

    this.gl = this.canvas.getContext('webgl2');
    this.gl.getExtension('EXT_color_buffer_float');
    this.gl.getExtension('OES_texture_float_linear');
    this.gl.getExtension('EXT_float_blend');

    this.initDisplayVertexBuffer();
    this.initDefaultVertexBuffer();
  }

  static setUniforms(state, igl, uniforms, locations) {
    let texnum = 0;

    for (let i = 0; i < uniforms.length; ++i) {
      const ufn = uniforms[i][2];
      const loc = locations[i];

      switch (uniforms[i][1]) {
      case 'tex':
        igl.activeTexture(igl['TEXTURE'+String(texnum)]);
        igl.bindTexture(igl.TEXTURE_2D, ufn(state));
        igl.uniform1i(loc, texnum++);
        break;
      case '1f':
        igl.uniform1f(loc, ufn(state));
        break;
      case '1i':
        igl.uniform1i(loc, ufn(state));
        break;
      case '1u':
        igl.uniform1ui(loc, ufn(state));
        break;
      case 'mat4':
        igl.uniformMatrix4fv(loc, false, ufn(state));
        break;
      case 'vec3':
        igl.uniform3fv(loc, ufn(state));
        break;
      default:
        alert(`Uniform ${i} type not recognized`);
        igl.uniform1f(loc, ufn(state));
      }
    }
  }

  loadShader(type, source) {
    const gl = this.gl;

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occured compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  loadFloatTexture(width, height, values) {
    const gl = this.gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA32F;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.FLOAT;

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, values);

    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
  }

  loadUintTexture(width, height, values) {
    const gl = this.gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA32UI;
    const border = 0;
    const format = gl.RGBA_INTEGER;
    const type = gl.UNSIGNED_INT;

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, values);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
  }

  loadShaderProgram(vertexShaderSource, fragmentShaderSource) {
    const gl = this.gl;

    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  }

  attachTextures(framebuffer, textures) {
    const gl = this.gl;

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);

    const draw_buffers = [];

    for (let i = 0; i < textures.length; ++i) {
      gl.framebufferTexture2D(
        gl.DRAW_FRAMEBUFFER,
        gl['COLOR_ATTACHMENT' + i],
        gl.TEXTURE_2D,
        textures[i],
        0,
      );

      draw_buffers.push(gl['COLOR_ATTACHMENT' + i]);
    }

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

    return draw_buffers;
  }

  initDisplayVertexBuffer() {
    const gl = this.gl;

    const vertex_array = new Float32Array([
      // Front face
      -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
      // Back face
      -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
      // Top face
      -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
      // Bottom face
      -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
      // Right face
      1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
      // Left face
      -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ]);

    const index_array = new Uint16Array([
      0,  1,  2,  0,  2,  3,    // front
      4,  5,  6,  4,  6,  7,    // back
      8,  9,  10, 8,  10, 11,   // top
      12, 13, 14, 12, 14, 15,   // bottom
      16, 17, 18, 16, 18, 19,   // right
      20, 21, 22, 20, 22, 23,   // left
    ]);

    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertex_array, gl.STATIC_DRAW, 0);

    const index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index_array, gl.STATIC_DRAW);

    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.display_vertex_buffer = vertex_buffer;
    this.display_index_buffer = index_buffer;
  }

  initDefaultVertexBuffer() {
    const gl = this.gl;

    const vertex_array = new Float32Array([
      1, 1, 0,
      0, 1, 0,
      1, 0, 0,
      0, 0, 0,
    ]);

    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertex_array, gl.STATIC_DRAW, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.default_vertex_buffer = vertex_buffer;
  }

  useDisplayVertexBuffer(program) {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.display_vertex_buffer);
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.display_index_buffer);

    const vertex_loc = gl.getAttribLocation(program, 'position');
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    // The array buffer must be bound from earlier
    gl.vertexAttribPointer(
      vertex_loc,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );

    gl.enableVertexAttribArray(vertex_loc);

    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  useDefaultVertexBuffer(program) {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.default_vertex_buffer);

    const vertex_loc = gl.getAttribLocation(program, 'position');
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    // The array buffer must be bound from earlier
    gl.vertexAttribPointer(
      vertex_loc,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );

    gl.enableVertexAttribArray(vertex_loc);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  getFloatTextureArray(texture, width, height, array) {
    const gl = this.gl;

    const framebuffer = gl.createFramebuffer();

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);

    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, array);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
  }

  getFloatPixel(texture, xidx, yidx, array) {
    const gl = this.gl;

    const framebuffer = gl.createFramebuffer();

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);

    gl.readPixels(xidx, yidx, 1, 1, gl.RGBA, gl.FLOAT, array);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
  }

  getUintTextureArray(texture, width, height, array) {
    const gl = this.gl;

    const framebuffer = gl.createFramebuffer();

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);

    gl.readPixels(0, 0, width, height, gl.RGBA_INTEGER, gl.UNSIGNED_INT, array);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
  }

  createProgram(vert, frag, uniforms, out_textures, dims) {
    const gl = this.gl;

    const framebuffer = gl.createFramebuffer();
    const program = this.loadShaderProgram(vert, frag);
    gl.useProgram(program);

    const locations = uniforms.map(u => gl.getUniformLocation(program, u[0]));
    const set_uniforms = (state, igl) => GlHelper.setUniforms(state, igl, uniforms, locations);

    const canvas = this.canvas;
    const gl_helper = this;

    const run = (state) => {
      const old_width = canvas.width;
      const old_height = canvas.height;

      if (dims) {
        canvas.width = dims[0];
        canvas.height = dims[1];
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);
      set_uniforms(state, gl);

      const draw_buffers = gl_helper.attachTextures(framebuffer, out_textures(state));

      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.drawBuffers(draw_buffers);

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);

      gl_helper.useDefaultVertexBuffer(program);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

      if (dims) {
        canvas.width = old_width;
        canvas.height = old_height;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    }

    return run;
  }

  createDisplay(vert, frag, uniforms, display_canvas) {
    const gl = this.gl;

    const program = this.loadShaderProgram(vert, frag);
    gl.useProgram(program);

    const locations = uniforms.map(u => gl.getUniformLocation(program, u[0]));
    const set_uniforms = (state, igl) => GlHelper.setUniforms(state, igl, uniforms, locations);

    const canvas = this.canvas;
    const gl_helper = this;

    const run = (state) => {
      const old_width = canvas.width;
      const old_height = canvas.height;

      canvas.width = display_canvas.width;
      canvas.height = display_canvas.height;
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.useProgram(program);
      set_uniforms(state, gl);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.CULL_FACE);

      gl.clearColor(1.0, 1.0, 1.0, 1.0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl_helper.useDisplayVertexBuffer(program);

      gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, 256*256*256);
      display_canvas.getContext('2d').drawImage(gl.canvas, 0, 0, display_canvas.width, display_canvas.height);

      canvas.width = old_width;
      canvas.height = old_height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    return run;
  }
};

export { GlHelper };
