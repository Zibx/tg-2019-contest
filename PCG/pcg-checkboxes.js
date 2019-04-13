(function(PCG){
    var D = PCG.D;
    PCG.initCheckboxes = function initCheckboxes(){
        var _self = this,
            switchesEl = this.renderTo.switches;

        while( switchesEl.childNodes.length ){
            switchesEl.removeChild( switchesEl.lastChild );
        }
        let list = [];
        this.columns.forEach( function( name, i ){
            var dataRow = { name: name, show: true, i: i, opacity: 1 };
            list.push( dataRow );
            D.label( {
                    cls: 'pcg-checkbox-wrapper',
                    renderTo: switchesEl
                },
                // children
                D.input( {
                    cls: 'pcg-checkbox__input',
                    attr: { type: 'checkbox', checked: true },
                    on: {
                        change: ( e ) => {
                            if(e.target.checked === false && _self._visible.length === 1){
                                e.target.checked = true;
                                setTimeout(function() {
                                    e.target.checked = true
                                },0);
                                e.target.classList.add('error-checkbox');
                                setTimeout(function() {
                                    e.target.classList.remove('error-checkbox');
                                }, _self.animation.lastCheckboxShake);
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
                                viewBox: "0 0 30 30",
                            },
                            style: { fill: _self.getColor(name, 1)  }
                        },
                        D.path( {

                            attr: {
                                // circle
                                d: 'M15,15m-13,0a13,13,0,1,0,26,0a13,13,0,1,0,-26,0 ' +
                                    // check
                                    'M21.707,11.707l-7.56,7.56c-0.188,0.188-0.442,0.293-0.707,0.293s-0.52-0.105-0.707-0.293' +
                                    'l-3.453-3.453c-0.391-0.391-0.391-1.023,0-1.414  s1.023-0.391,1.414,0l2.746,2.746' +
                                    'l6.853-6.853c0.391-0.391,1.023-0.391,1.414,0S22.098,11.316,21.707,11.707z'
                            }
                        } )
                    )
                ),
                _self.names[ name ]
            );

        } );
        this._all = list;
        this.updateVisible();
    };
})(window['PCG']);