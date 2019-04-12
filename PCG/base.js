// Pico pico graph!
const PCG = window['PCG'] = function(cfg) {
    if(cfg.consts){
        this.consts = Object.assign(Object.assign({}, this.consts), cfg.consts);
        delete cfg.consts;
    }
    Object.assign(this, cfg);
    this._update = this._update.bind(this);
    this.resize = this.resize.bind(this);
    this.init();
};