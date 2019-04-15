(function(PCG){
    var svgNS = 'http://www.w3.org/2000/svg';

// I am too lazy to do DOM manually / anyway this solution is optimal enough

// ~jsx h function
    var domEl = function( type, cfg ){
        cfg = cfg || {};
        var cls = cfg.cls,
            style = cfg.style,
            attr = cfg.attr,
            prop = cfg.prop,
            on = cfg.on,
            renderTo = cfg.renderTo,
            el = cfg.el || document.createElement( type ),
            classList = el.classList;

        var i, _i;

        if( cls ){
            if(el.tagName.toLowerCase() === 'svg'){
                el.setAttribute('class',cls);
            }else{
                el.className = cls;
            }
            //if(el.className !== cls)debugger
            //cls.split( ' ' ).forEach( function( clsItem ){ classList.add( clsItem ); });
        }

        if( style ){
            PCG.apply( el.style, style );
        }

        for( i in attr ){
            attr.hasOwnProperty( i ) && el.setAttribute( i, attr[ i ] );
        }

        for( i in prop ){
            prop.hasOwnProperty( i ) && ( el[ i ] = prop[ i ] );
        }

        for( i in on ){
            on.hasOwnProperty( i ) && el.addEventListener( i, on[ i ] );
        }

        for( i = 2, _i = arguments.length; i < _i; i++ ){
            var child = arguments[ i ];
            type = typeof child;
            if( type !== 'object' ){
                child = D.Text( child );
            }
            el.appendChild( child );
        }

        if( renderTo ){
            renderTo.appendChild( el );
        }

        return el;
    };

    var D = PCG.D = {
        svg: null,
        label: null,
        div: null,
        path: null,
        canvas: null,
        Text: function( val ){ return document.createTextNode( val );}
    };
    'div,input,label,canvas,span'.split( ',' ).forEach( function( name ){
        D[ name ] = function(){
            return domEl.apply( null, [ name ].concat([].slice.call(arguments)))
        };
    } );

    'svg,path,circle'.split( ',' ).forEach( function( name ){
        D[ name ] = function( cfg){
            if( !cfg ){
                cfg = {};
            }
            cfg.el = document.createElementNS( svgNS, name );
            cfg.el.setAttribute( 'xmlns', svgNS );
            return domEl.apply( null, [ null ].concat([].slice.call(arguments)))
        };
    } );

    D.removeChildren = function(el){
        var subEl;
        while((subEl = el.lastChild)){
            el.removeChild(subEl);
        }
    };
})(window['PCG']);