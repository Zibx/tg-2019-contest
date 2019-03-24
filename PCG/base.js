// Pico pico graph!
const PCG = window['PCG'] = function(cfg) {
    Object.assign(this, cfg);
    this._update = this._update.bind(this);
    this.resize = this.resize.bind(this);
    this.init();
};