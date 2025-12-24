import { BoneSim } from './bone.js';

const display_canvas = document.getElementById('display-canvas');

const inputs = {
  a: document.getElementById('param-a'),
  b: document.getElementById('param-b'),
  clast_speed: document.getElementById('param-clast-speed'),
  clast_radius: document.getElementById('param-clast-radius'),
  num_clasts: document.getElementById('param-num-clasts'),
};

const normalized_display_threshold = document.getElementById('param-show-threshold');

const update_inputs = (bone_sim, inputs) => {
  for (let key in inputs) {
    inputs[key].value = bone_sim.state.uniforms[key];
  }
};

const update_state = (bone_sim, inputs) => {
  for (let key in inputs) {
    bone_sim.state.uniforms[key] = inputs[key].value;
  }
};

const button_update = document.getElementById('button-update');

button_update.onclick = () => {
  update_state(bone_sim, inputs);
};

const nextframe = () => new Promise(resolve => requestAnimationFrame(resolve));

const bone_sim = new BoneSim(display_canvas);
bone_sim.initializeState();
update_inputs(bone_sim, inputs);

normalized_display_threshold.oninput = () => {
  bone_sim.state.uniforms.normalized_display_threshold = Number(normalized_display_threshold.value);
};

await bone_sim.createPrograms();

bone_sim.runSimulationInit();

await nextframe();

const display_rate = 0;
let iter = 0;
for (;;) {
  bone_sim.runSimulation();

  if (iter++ >= display_rate) {
    await nextframe();
    bone_sim.runDisplay();
    iter = 0;
  }
}
