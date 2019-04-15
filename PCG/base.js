// Pico pico graph!
var PCG = window['PCG'] = function(cfg) {
    if(cfg.consts){
        this.consts = PCG.apply(PCG.apply({}, this.consts), cfg.consts);
        delete cfg.consts;
    }
    PCG.apply(this, cfg);
    this._update = this._update.bind(this);
    this.resize = this.resize.bind(this);
    this.init();
};