(function(PCG){
    var D = PCG.D;
    var isVisible = function(el) {return el.show;};
    var animation = PCG.animation;
    PCG.initCheckboxes = function initCheckboxes(){
        var _self = this,
            switchesEl = this.renderTo.switches;

        while( switchesEl.childNodes.length ){
            switchesEl.removeChild( switchesEl.lastChild );
        }
        var list = [];
        var columns = this.columns;
        columns.forEach( function( name, i ){
            var dataRow = { name: name, show: true, i: i, opacity: 1 };
            list.push( dataRow );
            if(columns.length === 1)
                return;
            D.label( {
                    cls: 'pcg-checkbox-wrapper',
                    renderTo: switchesEl
                },
                // children
                D.input( {
                    cls: 'pcg-checkbox__input',
                    attr: { type: 'checkbox', checked: true },
                    on: {
                        change: function( e ){
                            if(e.target.checked === false && _self._all.filter(isVisible).length === 1){
                                // PREVENT
                                e.target.checked = true;
                                setTimeout(function() {
                                    e.target.checked = true
                                },0);
                                e.target.classList.add('error-checkbox');
                                setTimeout(function() {
                                    e.target.classList.remove('error-checkbox');
                                }, animation.lastCheckboxShake);
                            }else{
                                list[ i ].show = e.target.checked;
                                _self.updateVisible();
                            }
                            e.preventDefault();
                        }
                    }
                } ),
                D.div( { cls: 'pcg-checkbox__img-wrapper' },
                    D.svg( {
                            cls: 'pcg-checkbox__img',
                            attr: {
                                viewBox: "0 0 36 31",
                            },
                            style: { fill: _self.getColor(name, 1)  }
                        },
                        D.path( {

                            attr: {
                                d: 'M35.07.79a2.64 2.64 0 0 1 .71 1.42A3 3 0 0 1 35 4.62c-2 2.3-20.93 24.33-22 25.25a1.72 1.72 0 0 1-1 .42 1.57 1.57 0 0 1-1-.42c-.74-.61-4.68-4.59-10-10.12a2.92 2.92 0 0 1-1-2.38 2.85 2.85 0 0 1 .83-1.5A3 3 0 0 1 2.11 15C3.57 14.6 5 16 5 16l5.83 5.83 1 1.13 1-1.08L30.57 1.41A3.3 3.3 0 0 1 33.62 0a2.89 2.89 0 0 1 1.45.79z'
                            }
                        } )
                    )
                ),
                D.div({ cls: 'pcg-checkbox__text-wrapper'}, _self.names[ name ])

            );

        } );
        this._all = list;
        this.updateVisible();
    };
})(window['PCG']);