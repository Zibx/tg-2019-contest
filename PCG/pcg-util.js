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
    MinMax .prototype = {
        min: +Infinity,
        max: -Infinity,
        delta: 0,
        update: function(o) {
            if(o.min<this.min){
                this.min = o.min;
            }
            if(o.max>this.max){
                this.max = o.max;
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