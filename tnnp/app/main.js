/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * 2D TP MODEL
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 30 Aug 2017 05:44:10 PM EDT 
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
define([    'require',
            'shader!vertShader.vert',
            'shader!initShader.frag',
            'shader!compShader.frag',
            'shader!clickShader.frag',
            'shader!bvltShader.frag',
            'Abubu/Abubu'
            ],
function(   require,
            vertShader,
            initShader,
            compShader,
            clickShader,
            bvltShader,
            Abubu
            ){
"use strict" ;

/*========================================================================
 * Global Parameters
 *========================================================================
 */
var log = console.log ;
var params ;
var env ;
var gui ;

/*========================================================================
 * createGui
 *========================================================================
 */
function createGui(){
    env.gui = new Abubu.Gui();
    gui = env.gui.addPanel({width:300}) ;

/*-------------------------------------------------------------------------
 * Model Parameters
 *-------------------------------------------------------------------------
 */
//    gui.mdlPrmFldr  =   gui.addFolder( 'Model Parameters'   ) ;
//    addCoeficients(     gui.mdlPrmFldr, ['C_m', 'diffCoef'] ,
//                        [env.comp1,env.comp2], {min:0}) ;
//
/*------------------------------------------------------------------------
 * Time Coeficients
 *------------------------------------------------------------------------
 */
//    gui.tcfPrmFldr = gui.addFolder( 'Time Coeficients' ) ;
//    addCoeficients( gui.tcfPrmFldr, [
//                                    'C_tau_x1',
//                                    'C_tau_m',
//                                    'C_tau_h',
//                                    'C_tau_j',
//                                    'C_tau_d',
//                                    'C_tau_f',
//                                ] ,
//                    [env.comp1,env.comp2 ] ) ;
//    gui.tcfPrmFldr.open() ;
//
/*------------------------------------------------------------------------
 * Solver Parameters
 *------------------------------------------------------------------------
 */
//    gui.slvPrmFldr  = gui.addFolder( 'Solver Parameters' ) ;
//    gui.slvPrmFldr.add( env, 'dt').name('Delta t').onChange(
//         function(){
//            Abubu.setUniformInSolvers('dt', env.dt,
//                    [env.comp1,env.comp2 ]) ;
//         }
//    );
//
//    gui.slvPrmFldr.add( env, 'ds_x' ).name( 'Domain size-x').onChange(
//        function(){
//            Abubu.setUniformInSolvers('ds_x', env.ds_x,
//                    [env.comp1,env.comp2 ]) ;
//        }
//    ) ;
//    gui.slvPrmFldr.add( env, 'ds_y' ).name( 'Domain size-y').onChange(
//        function(){
//            Abubu.setUniformInSolvers('ds_y', env.ds_y,
//                    [env.comp1,env.comp2 ]) ;
//        }
//    ) ;
//
//    gui.slvPrmFldr.add( env, 'width').name( 'x-resolution' )
//    .onChange( function(){
//        Abubu.resizeRenderTargets(
//                [fmhjd,fvcxf,smhjd,svcxf], env.width, env.height);
//    } ) ;
//
//    gui.slvPrmFldr.add( env, 'height').name( 'y-resolution' )
//    .onChange( function(){
//        Abubu.resizeRenderTargets(
//            [
//                env.fmhjd,
//                env.fvcxf,
//                env.smhjd,
//                env.svcxf
//            ],
//            env.width,
//            env.height);
//    } ) ;
//
/*------------------------------------------------------------------------
 * Display Parameters
 *------------------------------------------------------------------------
 */
    gui.dspPrmFldr  = gui.addFolder( 'Display Parameters' ) ;
    gui.dspPrmFldr.add( env, 'colormap',
            Abubu.getColormapList())
                .onChange(  function(){
                                env.disp.setColormap(env.colormap);
                                refreshDisplay() ;
                            }   ).name('Colormap') ;

    gui.dspPrmFldr.add( env, 'probeVisiblity').name('Probe Visiblity')
        .onChange(function(){
            env.disp.setProbeVisiblity(env.probeVisiblity);
            refreshDisplay() ;
        } ) ;
    gui.dspPrmFldr.add( env, 'frameRate').name('Frame Rate Limit')
        .min(60).max(10000).step(60)

    gui.dspPrmFldr.add( env, 'timeWindow').name('Signal Window [ms]')
    .onChange( function(){
        env.plot.updateTimeWindow(env.timeWindow) ;
        refreshDisplay() ;
    } ) ;

/*------------------------------------------------------------------------
 * tipt
 *------------------------------------------------------------------------
 */
    gui.tptPrmFldr = gui.dspPrmFldr.addFolder( 'Tip Trajectory') ;
    gui.tptPrmFldr.add( env, 'tiptVisiblity' )
        .name('Plot Tip Trajectory?')
        .onChange(function(){
            env.disp.setTiptVisiblity(env.tiptVisiblity) ;
            refreshDisplay() ;
        } ) ;
    gui.tptPrmFldr.add( env, 'tiptThreshold').name( 'Threshold [mv]')
        .onChange( function(){
                env.disp.setTiptThreshold( env.tiptThreshold ) ;
                } ) ;
    gui.tptPrmFldr.open() ;

    gui.dspPrmFldr.open() ;

/*------------------------------------------------------------------------
 * save
 *------------------------------------------------------------------------
 */
    var svePrmFldr = gui.addFolder('Save Canvases') ;
    svePrmFldr.add( env, 'savePlot2DPrefix').name('File Name Prefix') ;
    svePrmFldr.add( env, 'savePlot2D' ).name('Save Plot2D') ;

/*------------------------------------------------------------------------
 * vltBreak
 *------------------------------------------------------------------------
 */
    gui.vltBreak = gui.addFolder( 'Break Voltage' );
    gui.vltBreak.add( env, 'vltBreak' ).name( 'Autobreak?') ;
    gui.vltBreak.add( env, 'ry'         ).onChange(function(){
        env.breakVlt.setUniform('ry', env.ry) ;
    } ) ;
    gui.vltBreak.add( env, 'breakTime').name('Break Time [ms]') ;

/*------------------------------------------------------------------------
 * Simulation
 *------------------------------------------------------------------------
 */
    gui.smlPrmFldr  = gui.addFolder(    'Simulation'    ) ;
    gui.smlPrmFldr.add( env,  'clickRadius' )
        .min(0.01).max(1.0).step(0.01)
        .name('Click Radius')
        .onChange(function(){
                env.click.setUniform('clickRadius',env.clickRadius) ;
                } ) ;
    gui.smlPrmFldr.add( env,
        'clicker',
        [   'Conduction Block',
            'Pace Region',
            'Signal Loc. Picker',
            'Autopace Loc. Picker'  ] ).name('Clicker Type') ;

    gui.smlPrmFldr.add( env, 'time').name('Solution Time [ms]').listen() ;

    gui.smlPrmFldr.add( env, 'initialize').name('Initialize') ;
    gui.smlPrmFldr.add( env, 'solve').name('Solve/Pause') ;
    gui.smlPrmFldr.open() ;

/*------------------------------------------------------------------------
 * addCoeficients
 *------------------------------------------------------------------------
 */
    function addCoeficients( fldr,
            coefs,
            solvers ,
            options ){
        var coefGui = {} ;
        var min = undefined ;
        var max = undefined ;
        if (options != undefined ){
            if (options.min != undefined ){
                min = options.min ;
            }
            if (options.max != undefined ){
                max = options.max ;
            }
        }
        for(var i=0; i<coefs.length; i++){
            var coef = addCoef(fldr,coefs[i],solvers) ;
            if (min != undefined ){
                coef.min(min) ;
            }
            if (max != undefined ){
                coef.max(max) ;
            }
            coefGui[coefs[i]] = coef ;
        }
        return coefGui ;

        /* addCoef */
        function addCoef( fldr,
                coef,
                solvers     ){
            var coefGui =   fldr.add( env, coef )
                .onChange(
                        function(){
                        Abubu.setUniformInSolvers(  coef,
                                env[coef],
                                solvers  ) ;
                        } ) ;

            return coefGui ;

        }
    }

    return ;
} /* End of createGui */

/*========================================================================
 * Environment
 *========================================================================
 */
function Environment(){
    this.running = false ;

    /* Model Parameters         */
    this.capacitance= 0.185,

    this.C_m        = 1.0 ;
    this.diffCoef   = 0.001 ;

    this.minVlt     = -100 ;
    this.maxVlt     = 50. ;

    this.cellType   = 0 ;

    /* Display Parameters       */
    this.colormap    =   'rainbowHotSpring';
    this.dispWidth   =   512 ;
    this.dispHeight  =   512 ;
    this.frameRate   =   2400 ;
    this.timeWindow  =   1000 ;
    this.probeVisiblity = false ;

    this.tiptVisiblity= false ;
    this.tiptThreshold=  -80.;
    this.tiptColor    = "#FFFFFF";

    /* Solver Parameters        */
    this.width       =   512 ;
    this.height      =   512 ;
    this.dt          =   1.e-1 ;
    this.cfl         =   1.0 ;
    this.ds_x        =   12 ;
    this.ds_y        =   12 ;
    this.C_Na        =   1.0 ;
    this.C_NaCa      =   1.0 ;
    this.C_to        =   1.0 ;
    this.C_CaL       =   1.0 ;
    this.C_Kr        =   1.0 ;
    this.C_Ks        =   1.0 ;
    this.C_K1        =   1.0 ;
    this.C_NaK       =   1.0 ;
    this.C_bNa       =   1.0 ;
    this.C_pK        =   1.0 ;
    this.C_bCa       =   1.0 ;
    this.C_pCa       =   1.0 ;
    this.C_leak      =   1.0 ;
    this.C_up        =   1.0 ;
    this.C_rel       =   1.0 ;
    this.C_xfer      =   1.0 ;

    /* Autopace                 */
    this.pacing      = false ;
    this.pacePeriod  = 300 ;
    this.autoPaceRadius= 0.01 ;

    /* Solve                    */
    this.solve       = function(){
        this.running = !this.running ;
        return ;
    } ;
    this.time        = 0.0 ;
    this.clicker     = 'Pace Region';

    this.autoBreakThreshold = -40 ;
    //this.bvltNow     = breakVlt ;
    this.ry          = 0.5 ;
    this.vltBreak    = true ;
    this.breakTime   = 390 ;
    this.notBreaked  = true ;

    this.autostop    = false;
    this.autostopInterval = 300 ;

    this.savePlot2DPrefix = '' ;
    this.savePlot2D    = function(){
        this.running = false ;
        var prefix ;
        try{
            prefix = eval(env.savePlot2DPrefix) ;
        }catch(e){
            prefix = this.savePlot2DPrefix ;
        }
        Abubu.saveCanvas( 'canvas_1',
        {
            number  : this.time ,
            postfix : '_'+this.colormap ,
            prefix  : prefix,
            format  : 'png'
        } ) ;
    }

    /* Clicker                  */
    this.clickRadius     = 0.1 ;
    this.clickPosition   = [0.5,0.5] ;
    this.conductionValue = [-83.0,0,0] ;
    this.paceValue       = [0,0,0,0] ;
}

/*========================================================================
 * Initialization of the GPU and Container
 *========================================================================
 */
function loadWebGL()
{
    var canvas_1 = document.getElementById("canvas_1") ;
    var canvas_2 = document.getElementById("canvas_2") ;

    env = new Environment() ;
    params = env ;
/*-------------------------------------------------------------------------
 * stats
 *-------------------------------------------------------------------------
 */
    var stats       = new Stats() ;
    document.body.appendChild( stats.domElement ) ;

/*------------------------------------------------------------------------
 * defining all render targets
 *------------------------------------------------------------------------
 */
    env.fvrnk = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.svrnk = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.fcssr = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.scssr = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.fmhjx = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.smhjx = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.fdfff = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.sdfff = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.frsxr = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.srsxr = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.scurr = new Abubu.FloatRenderTarget( env.width, env.height ) ;

/*------------------------------------------------------------------------
 * init solver to initialize all textures
 *------------------------------------------------------------------------
 */
    env.pTargets = function(_vrnk, _cssr, _mhjx, _dfff, _rsxr){
        this.vrit = { location : 0 , target: _vrnk } ;
        this.cssr = { location : 1 , target: _cssr } ;
        this.mhjx = { location : 2 , target: _mhjx } ;
        this.dfff = { location : 3 , target: _dfff } ;
        this.rsxr = { location : 4 , target: _rsxr } ;
    } ;

    env.finit  = new Abubu.Solver( {
        fragmentShader  : initShader.value ,
        vertexShader    : vertShader.value ,
        uniforms        : {
            cellType    : { type : 'i', value : env.cellType    } ,
        } ,
        renderTargets   : 
            new env.pTargets(   env.fvrnk, env.fcssr, 
                                env.fmhjx, env.fdfff, env.frsxr     ) ,
       
    } ) ;
    env.sinit = new Abubu.Solver( {
        fragmentShader  : initShader.value ,
        vertexShader    : vertShader.value ,
        uniforms        : {
            cellType    : { type : 'i', value : env.cellType    } ,
        } ,
        renderTargets   : 
            new env.pTargets(   env.svrnk, env.scssr, 
                                env.smhjx, env.sdfff, env.srsxr     ) ,
       
    } ) ;

/*------------------------------------------------------------------------
 * comp1 and comp2 solvers for time stepping
 *------------------------------------------------------------------------
 */
    env.compUniforms = function(_vrnk, _cssr, _mhjx, _dfff, _rsxr ){
        /* input textures */
        this.inVrnk     = { type : 't', value : _vrnk           } ;
        this.inCssr     = { type : 't', value : _cssr           } ;
        this.inMhjx     = { type : 't', value : _mhjx           } ;
        this.inDfff     = { type : 't', value : _dfff           } ;
        this.inRsxr     = { type : 't', value : _rsxr           } ;

        /* -------------- */
        this.cellType   = { type : 'i', value : env.cellType    } ;
        this.C_m        = { type : 'f', value : env.C_m         } ;
        this.capacitance= { type : 'f', value : env.capacitance } ;
        this.diffCoef   = { type : 'f', value : env.diffCoef    } ;
        this.dt         = { type : 'f', value : env.dt          } ;
        this.ds_x       = { type : 'f', value : env.ds_x        } ;
        this.ds_y       = { type : 'f', value : env.ds_y        } ;
        this.C_Na       = { type : 'f', value : env.C_Na        } ;
        this.C_NaCa     = { type : 'f', value : env.C_NaCa      } ;
        this.C_to       = { type : 'f', value : env.C_to        } ;
        this.C_CaL      = { type : 'f', value : env.C_CaL       } ;
        this.C_Kr       = { type : 'f', value : env.C_Kr        } ;
        this.C_Ks       = { type : 'f', value : env.C_Ks        } ;
        this.C_K1       = { type : 'f', value : env.C_K1        } ;
        this.C_NaK      = { type : 'f', value : env.C_NaK       } ;
        this.C_bNa      = { type : 'f', value : env.C_bNa       } ;
        this.C_pK       = { type : 'f', value : env.C_pK        } ;
        this.C_bCa      = { type : 'f', value : env.C_bCa       } ;
        this.C_pCa      = { type : 'f', value : env.C_pCa       } ;
        this.C_leak     = { type : 'f', value : env.C_leak      } ;
        this.C_up       = { type : 'f', value : env.C_up        } ;
        this.C_rel      = { type : 'f', value : env.C_rel       } ;
        this.C_xfer     = { type : 'f', value : env.C_xfer      } ;

    } ;

    env.comp1 = new Abubu.Solver( {
        fragmentShader  : compShader.value,
        vertexShader    : vertShader.value,
        uniforms        : new env.compUniforms(
            env.fvrnk, env.fcssr, 
            env.fmhjx, env.fdfff, env.frsxr  ) ,
        renderTargets   : new env.pTargets( 
            env.svrnk, env.scssr, 
            env.smhjx, env.sdfff, env.srsxr 
        ) ,
    } ) ;
    
    env.comp2 = new Abubu.Solver( {
        fragmentShader  : compShader.value,
        vertexShader    : vertShader.value,
        uniforms        : new env.compUniforms(
            env.svrnk, env.scssr, 
            env.smhjx, env.sdfff, env.srsxr  
        ) ,
        renderTargets   : new env.pTargets( 
            env.fvrnk, env.fcssr, 
            env.fmhjx, env.fdfff, env.frsxr 
        ) ,
    } ) ;

/*------------------------------------------------------------------------
 * click solver
 *------------------------------------------------------------------------
 */
    env.click = new Abubu.Solver( {
        vertexShader    : vertShader.value ,
        fragmentShader  : clickShader.value ,
        uniforms        : {
            map         : { type: 't',  value : env.fvrnk           } ,
            clickValue   : { type: 'v4', value : [0,0,0,0 ]         } ,
            clickPosition: { type: 'v2', value : env.clickPosition  } ,
            clickRadius  : { type: 'f',  value : env.clickRadius    } ,
        } ,
        renderTargets   : {
            FragColor   : { location : 0,   target : env.svrnk      } ,
        } ,
        clear           : true ,
    } ) ;
    env.clickCopy = new Abubu.Copy(env.svrnk, env.fvrnk ) ;

/*------------------------------------------------------------------------
 * break
 *------------------------------------------------------------------------
 */
    env.breakVlt = new Abubu.Solver({
        vertexShader    : vertShader.value ,
        fragmentShader  : bvltShader.value ,
        uniforms: {
            map     : { type : 't', value : env.fvrnk   } ,
            ry      : { type : 'f', value : env.ry      } ,
        } ,
        targets : {
            FragColor : { location : 0 , target : env.svrnk } ,
        } ,
    } ) ;
    env.breakCopy = new Abubu.Copy( env.svrnk, env.fvrnk  ) ;

    env.breakVltNow = function(){
        env.breakVlt.render() ;
        env.breakCopy.render() ;
        env.notBreaked = false ;
        refreshDisplay() ;
    }

/*------------------------------------------------------------------------
 * Signal Plot
 *------------------------------------------------------------------------
 */
    env.plot = new Abubu.SignalPlot( {
            noPltPoints : 1024,
            grid        : 'on' ,
            nx          : 5 ,
            ny          : 6 ,
            xticks : { mode : 'auto', unit : 'ms', font:'11pt Times'} ,
            yticks : { mode : 'auto', unit : 'mv' } ,
            canvas      : canvas_2,
    });

    env.plot.addMessage(    'Membrane Potential at the Probe',
                        0.5,0.05,
                    {   font : "11pt Arial" ,
                        align: "center"                          } ) ;

    env.vsgn = env.plot.addSignal( env.fvrnk, {
            channel : 'r',
            minValue : -100 ,
            maxValue : 50 ,
            restValue: -83,
            color : [0.5,0,0],
            visible: true,
            linewidth : 2,
            timeWindow: env.timeWindow,
            probePosition : [0.5,0.5] , } ) ;

/*------------------------------------------------------------------------
 * disp
 *------------------------------------------------------------------------
 */
    env.disp= new Abubu.Plot2D({
        target : env.svrnk ,
        prevTarget : env.fvrnk ,
        colormap : env.colormap,
        canvas : canvas_1 ,
        minValue: -90 ,
        maxValue: 10 ,
        tipt : false ,
        tiptThreshold : env.tiptThreshold ,
        probeVisible : false ,
        colorbar : true ,
        unit : 'mv',
    } );
//    env.disp.showColorbar() ;
//    env.disp.addMessage(  'TNNP Model',
//                        0.05,   0.05, /* Coordinate of the
//                                         message ( x,y in [0-1] )   */
//                        {   font: "Bold 14pt Arial",
//                            style:"#000000",
//                            align : "start"             }   ) ;
//    env.disp.addMessage(  'Simulation by Abouzar Kaboudian @ CHAOS Lab',
//                        0.05,   0.1,
//                        {   font: "italic 10pt Arial",
//                            style: "#000000",
//                            align : "start"             }  ) ;
//
/*------------------------------------------------------------------------
 * initialize
 *------------------------------------------------------------------------
 */
    env.initialize = function(){
        env.time = 0 ;
        env.paceTime = 0 ;
        env.breaked = false ;
        env.finit.render() ;
        env.sinit.render() ;
        env.plot.init(0) ;
        env.disp.initialize() ;
        env.notBreaked = true ;
        refreshDisplay() ;
    }

/*-------------------------------------------------------------------------
 * Render the programs
 *-------------------------------------------------------------------------
 */
   env.initialize() ;

/*------------------------------------------------------------------------
 * createGui
 *------------------------------------------------------------------------
 */
   createGui() ;

/*------------------------------------------------------------------------
 * clicker
 *------------------------------------------------------------------------
 */
    canvas_1.addEventListener("click",      onClick,        false   ) ;
    canvas_1.addEventListener('mousemove',
            function(e){
                if ( e.buttons >=1 ){
                    onClick(e) ;
                }
            } , false ) ;

  function getVoltage(x, y) {
    const a = new Float32Array(4);
    const gl = env.fvrnk.gl;
    const fb = gl.createFramebuffer();

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, env.fvrnk.texture, 0);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);

    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.FLOAT, a);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);

    return a[0];
  }

/*------------------------------------------------------------------------
 * rendering the program ;
 *------------------------------------------------------------------------
 */
  env.save_array = [];

  function saveData(filename) {
    const file = new Blob([env.save_array.join('\n')], { type: 'text/plain' });
    const e = document.createElement('a');
    const url = URL.createObjectURL(file);
    e.href = url;
    e.download = filename;
    document.body.appendChild(e);
    e.click();
    setTimeout(() => {
      document.body.removeChild(e);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 's') {
      saveData('out_' + Date.now() + '.txt');
      env.save_array = [];
    } else if (e.key === 'r') {
      env.save_array = [];
    }
  });

    env.render = function(){
        if (env.running){
            for(var i=0 ; i< env.frameRate/120 ; i++){
                env.comp1.render() ;
                env.comp2.render() ;
                env.time += 2.0*env.dt ;
                env.paceTime += 2.0*env.dt ;
                stats.update();
                stats.update() ;
                env.save_array.push(getVoltage(Math.round(env.clickPosition[0]*512), Math.round(env.clickPosition[1]*512)));
                if (env.save_array.length > 10000) {
                  env.save_array.shift()
                }
                env.plot.update(env.time) ;
                env.disp.updateTipt() ;
            }
            if ( env.time > env.breakTime 
                    && env.notBreaked 
                    && env.vltBreak     ){
                env.breakVltNow() ;
            }
            refreshDisplay();
        }
        requestAnimationFrame(env.render) ;
    }

/*------------------------------------------------------------------------
 * add environment to document
 *------------------------------------------------------------------------
 */
    document.env = env ;

/*------------------------------------------------------------------------
 * render the webgl program
 *------------------------------------------------------------------------
 */
    env.render();

}/*  End of loadWebGL  */

/*========================================================================
 * refreshDisplay
 *========================================================================
 */
function refreshDisplay(){
    env.disp.render() ;
    env.plot.render() ;
}

/*========================================================================
 * onClick
 *========================================================================
 */
function onClick(e){
    env.clickPosition[0] =
        (e.clientX-canvas_1.offsetLeft) / env.dispWidth ;
    env.clickPosition[1] =  1.0-
        (e.clientY-canvas_1.offsetTop) / env.dispWidth ;

    env.click.setUniform('clickPosition',env.clickPosition) ;

    if (    env.clickPosition[0]   >   1.0 ||
            env.clickPosition[0]   <   0.0 ||
            env.clickPosition[1]   >   1.0 ||
            env.clickPosition[1]   <   0.0 ){
        return ;
    }
    clickRender() ;
    return ;
}

/*========================================================================
 * Render and display click event
 *========================================================================
 */
function clickRender(){
    switch( env['clicker']){
    case 'Conduction Block':
        env.click.setUniform('clickValue', env.conductionValue) ;
        clickSolve() ;
        requestAnimationFrame(clickSolve) ;
        break ;
    case 'Pace Region':
        env.click.setUniform('clickValue',env.paceValue) ;
        clickSolve() ;
        requestAnimationFrame(clickSolve) ;
        break ;
   case 'Signal Loc. Picker':
        env.plot.setProbePosition( env.clickPosition ) ;
        env.disp.setProbePosition( env.clickPosition ) ;
        env.plot.init() ;
        refreshDisplay() ;
        break ;
    case 'Autopace Loc. Picker':
        ///pacePos = new THREE.Vector2(clickPos.x, env.clickPosition[1]) ;
        paceTime = 0 ;
    }
    return ;
}
/*========================================================================
 * solve click event
 *========================================================================
 */
function clickSolve(){
    env.click.render() ;
    env.clickCopy.render() ;
    refreshDisplay() ;
}

/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * End of require()
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
loadWebGL() ;
} ) ;
