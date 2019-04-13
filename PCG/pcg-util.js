(function(PCG){
    PCG.lerp = function(from, to, percent,n) {
        if(n)
            return from+(to-from)*Math.pow(percent,1/n);
        else
            return from+(to-from)*percent;
    };
    PCG.path = {
        join: function(a,b) {
            return (a + '/'+ b).replace(/\/+/g,'/');
        }
    };

    var MinMax = function() {};
    MinMax.prototype = {
        min: +Infinity,
        max: -Infinity,
        delta: 0,
        update: function(o, opacity) {
            if(o.min<this.min){
                if(opacity !== void 0 && isFinite(this.min)){
                    this.min = this.min-(this.min-o.min)*opacity;
                }else{
                    this.min = o.min;
                }
            }
            if(o.max>this.max){
                if(opacity !== void 0 && isFinite(this.max)){
                    this.max = this.max+(o.max-this.max)*opacity;
                }else{
                    this.max = o.max;
                }
            }
            return this;
        },
        updateDelta: function() {
            this.delta = this.max-this.min;
            return this;
        }
    };
    PCG.MinMax = MinMax;
})(window['PCG']);