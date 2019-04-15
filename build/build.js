"use strict";function _instanceof(t,e){return null!=e&&"undefined"!=typeof Symbol&&e[Symbol.hasInstance]?e[Symbol.hasInstance](t):t instanceof e}function _typeof(t){return(_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}!function(){var M=window.PCG=function(t){Object.assign(this,t),this._update=this._update.bind(this),this.resize=this.resize.bind(this),this.init()},a="http://www.w3.org/2000/svg",s=function(t){var e,i,o=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},n=o.cls,a=o.style,s=o.attr,r=o.prop,l=o.on,h=o.renderTo,d=o.el||document.createElement(t),c=d.classList;for(e in n&&n.split(" ").forEach(function(t){return c.add(t)}),a&&Object.assign(d.style,a),s)s.hasOwnProperty(e)&&d.setAttribute(e,s[e]);for(e in r)r.hasOwnProperty(e)&&(d[e]=r[e]);for(e in l)l.hasOwnProperty(e)&&d.addEventListener(e,l[e]);for(e=2,i=arguments.length;e<i;e++){var u=arguments[e];"object"!==(t=_typeof(u))&&(u=W.Text(u)),d.appendChild(u)}return h&&h.appendChild(d),d},W=M.D={svg:null,label:null,div:null,path:null,Text:function(t){return document.createTextNode(t)}};"div,input,label".split(",").forEach(function(o){W[o]=function(){for(var t=arguments.length,e=new Array(t),i=0;i<t;i++)e[i]=arguments[i];return s.apply(null,[o].concat(e))}}),"svg,path,circle".split(",").forEach(function(n){W[n]=function(t){t||(t={}),t.el=document.createElementNS(a,n),t.el.setAttribute("xmlns",a);for(var e=arguments.length,i=new Array(1<e?e-1:0),o=1;o<e;o++)i[o-1]=arguments[o];return s.apply(null,[null,t].concat(i))}}),W.removeChildren=function(t){for(var e;e=t.lastChild;)t.removeChild(e)};W=M.D;M.updateYAxis=function(t,e){var i,o,n,a,s,r=this.els.YAxisHash,l=Math.ceil(t.max)-Math.floor(t.min),h=t.min,d=this.els.yAxisStorage,c=this.els.yAxisLabelsStorage,u=l/6,v=Math.pow(10,Math.ceil(Math.log(u)/Math.log(10)-1)),p=Math.round(u/v)*v,m=Math.ceil(h/v*10)*v/10,f=[m];for(a=1;a<7;a++)f.push(Math.round((m+p*a)/v)*v);var g=+new Date,x=this.world.graph.height,b=x+this.consts.XAxisHeight+this.consts.YAxisLabelPaddingBottom,w={};for(a=0;a<7;a++){(y=e(f[a]))<1.01*x&&.05<y&&(w[s=f[a]]=!0,s in r?(o=(i=r[s]).line,n=i.label,!1!==i.destroy&&(i.destroy=!1,o.classList.remove("hide"),n.classList.remove("hide"),o.classList.add("visible"),n.classList.add("visible")),!1===i.visible&&(i.visible=!0,o.classList.add("visible"),n.classList.add("visible")),o.style.top=y+"px",n.style.bottom=b-y+"px"):(r[s]={val:s,visible:!1,destroy:!1,line:W.div({cls:"pcg-y-axis",renderTo:d,style:{top:y+"px"}}),label:W.div({cls:"pcg-y-axis-label",renderTo:c,style:{bottom:b-y+"px"}},M.numberFormat(f[a]))},requestAnimationFrame(function(){})))}for(s in r)if(!(s in w)){o=(i=r[s]).line,n=i.label;var y=e(i.val);o.style.top=y+"px",n.style.bottom=b-y+"px",!1===i.destroy?(i.destroy=g+700,o.classList.add("hide"),n.classList.add("hide"),o.classList.remove("visible"),n.classList.remove("visible")):i.destroy<g&&(c.removeChild(i.label),d.removeChild(i.line),delete r[s])}};var p=function(t,e){return t/e*(e-45)+22.5};M.updateXAxis=function(){var t,e,i,o,n=this.frame.from,a=this.frame.to,s=(a-n)/6,r=(this.camera.offset,this.els.XAxisHash),l={},h=+new Date,d=this.world.graph.width,c=this.camera.AxisXGranule;for(t=n;t<a+c;t+=c)if(e=this.camera.offset%this.camera.AxisXGranule-this.frame.from%this.camera.AxisXGranule+t,v=this.getX(e),i=M.dateFormatter(e),l[e]=!0,e in r)!1!==(o=r[e]).destroy&&(o.destroy=!1,o.label.classList.remove("hide"),o.label.classList.add("visible")),!1===o.visible&&(o.visible=!0,o.label.classList.add("visible")),o.label.style.left=p(v,d)+"px";else{if(40<this.XAxisLabelCount)continue;o=r[e]={val:e,left:v,visible:!1,destroy:!1,label:W.div({cls:"pcg-x-axis-label",style:{left:p(v,d)+"px"},renderTo:this.els.xAxisLabelsStorage},i)},this.XAxisLabelCount++}var u=this.els.xAxisLabelsStorage;for(e in r)if(!(e in l)){o=r[e];var v=this.getX(o.val);o.label.style.left=p(v,d)+"px",!1===o.destroy?(o.destroy=h+400,o.label.classList.add("hide"),o.label.classList.remove("visible")):o.destroy<h?(u.removeChild(o.label),delete r[e],this.XAxisLabelCount--):this.update()}};W=M.D;M.initCheckboxes=function(){for(var o=this,n=this.renderTo.switches,a=function(){o._visible=s.filter(function(t){return t.show}).map(function(t){return t.i}),o.update(),o.navGraphUpdateVisibility()};n.childNodes.length;)n.removeChild(n.lastChild);var s=[];this.columns.forEach(function(t,e){var i={name:t,show:!0,i:e};s.push(i),W.label({cls:"pcg-checkbox-wrapper",renderTo:n},W.input({cls:"pcg-checkbox__input",attr:{type:"checkbox",checked:!0},on:{change:function(t){s[e].show=t.target.checked,a(),t.preventDefault()}}}),W.div({cls:"pcg-checkbox__img-wrapper"},W.svg({cls:"pcg-checkbox__img",attr:{viewBox:"0 0 30 30"},style:{fill:o.colors[t]}},W.path({attr:{d:"M15,15m-13,0a13,13,0,1,0,26,0a13,13,0,1,0,-26,0 M21.707,11.707l-7.56,7.56c-0.188,0.188-0.442,0.293-0.707,0.293s-0.52-0.105-0.707-0.293l-3.453-3.453c-0.391-0.391-0.391-1.023,0-1.414  s1.023-0.391,1.414,0l2.746,2.746l6.853-6.853c0.391-0.391,1.023-0.391,1.414,0S22.098,11.316,21.707,11.707z"}}))),o.names[t])}),this._all=s.map(function(t){return t.i}),a()};W=M.D;M.initDOM=function(){var t=this.renderTo;this.els={navWindow:W.div({cls:"navWindow",renderTo:t.nav}),nav:W.svg({renderTo:t.nav}),navEars:[W.div({renderTo:t.nav,cls:"navEar",style:{left:0}}),W.div({renderTo:t.nav,cls:"navEar",style:{right:0}})],navExpandControl:W.div({cls:"pcg pcg-nav__expand-control",renderTo:t.nav}),navMoveControl:W.div({cls:"pcg pcg-nav__move-control",renderTo:t.nav}),yAxisStorage:W.div({renderTo:t.graph}),verticalMouseSlice:W.div({cls:"pcg-tooltip__vertical-slice",renderTo:t.graph}),graph:W.svg({renderTo:t.graph}),yAxisLabelsStorage:W.div({renderTo:t.graph}),xAxisLabelsStorage:W.div({renderTo:t.graph}),tooltip:W.div({cls:"pcg-tooltip",renderTo:t.graph}),tooltipDate:W.div({cls:"pcg-tooltip__date"}),tooltipInfo:W.div({cls:"pcg-tooltip__info"}),highlightCircles:[],navGraphs:[],graphs:[],YAxisHash:{},XAxisHash:{}},this.XAxisLabelCount=0,this.els.tooltip.appendChild(this.els.tooltipDate),this.els.tooltip.appendChild(this.els.tooltipInfo),this.collectWorldInfo()},M.initListeners=function(){var o,i,n,a,s,r,l=this,h=this.consts.resizeOffset,d=!0,c=function(t){console.log("move",t.type);var e=[t.clientX,t.clientY],i=r(e[0]-o[0]);l.camera.offset=d?(n.from=s+i,n.from>n.to-r(1.3*h)&&(n.from=n.to-r(1.3*h)),n.from<l.minDate&&(n.from=l.minDate),n.to):(n.to=s+a+i,n.to<n.from+r(1.3*h)&&(n.to=n.from+r(1.3*h)),n.to>l.maxDate&&(n.to=l.maxDate),n.from),l.camera.action="resize",l.camera.toLeft=d;l.camera.AxisXGranule=864e5*Math.pow(2,Math.round(Math.log(Math.ceil((l.frame.to-l.frame.from)/6/864e5))/Math.log(2))),l.update()},u=function(t){t.touches&&t.touches.length&&c(t.touches[0])},v=function t(e){console.log("up",e&&e.type),window.removeEventListener("mouseup",t),document.removeEventListener("mousemove",c),l.els.navExpandControl.removeEventListener("touchend",t),l.els.navExpandControl.removeEventListener("touchcancel",t),l.els.navExpandControl.removeEventListener("touchmove",u),e&&e.cancelable&&e.preventDefault()},e=function(t){l.hideTooltip(),console.log("down",t.type),o=[t.clientX,t.clientY],i=l.world,n=l.frame,a=n.to-n.from,s=n.from,d=!0;var e=t.target.getBoundingClientRect();t.pageX-e.left>l.els.navExpandControl.clientWidth/2&&(d=!1),r=function(t){return t/i.nav.width*(l.maxDate-l.minDate)},v(),window.addEventListener("mouseup",v),document.addEventListener("mousemove",c),l.els.navExpandControl.addEventListener("touchend",v),l.els.navExpandControl.addEventListener("touchcancel",v),l.els.navExpandControl.addEventListener("touchmove",u),t.preventDefault&&t.preventDefault()};this.els.navExpandControl.addEventListener("mousedown",e),document.addEventListener("touchstart",function(t){}),this.els.navExpandControl.addEventListener("touchstart",function(t){t.touches&&t.touches.length&&e(t.touches[0]),t.cancelable&&t.preventDefault()},!0);var p=function(t){t.touches&&t.touches.length&&m(t.touches[0])},m=function(t){var e=[t.clientX,t.clientY];l.camera.action="move",n.from=s+(e[0]-o[0])/i.nav.width*(l.maxDate-l.minDate),n.from<l.minDate&&(n.from=l.minDate),n.to=n.from+a,n.to>l.maxDate&&(n.to=l.maxDate,n.from=n.to-a),l.update(),t.cancelable&&t.preventDefault()},f=function t(e){window.removeEventListener("mouseup",t),document.removeEventListener("mousemove",m),l.els.navMoveControl.removeEventListener("touchend",t),l.els.navMoveControl.removeEventListener("touchcancel",t),l.els.navMoveControl.removeEventListener("touchmove",p),e&&e.cancelable&&e.preventDefault()},g=function(t){o=[t.clientX,t.clientY],i=l.world,n=l.frame,a=n.to-n.from,s=n.from,f(),window.addEventListener("mouseup",f),document.addEventListener("mousemove",m),l.els.navMoveControl.addEventListener("touchend",f),l.els.navMoveControl.addEventListener("touchcancel",f),l.els.navMoveControl.addEventListener("touchmove",p)};this.els.navMoveControl.addEventListener("mousedown",g),this.els.navMoveControl.addEventListener("touchstart",function(t){t.touches&&t.touches.length&&g(t.touches[0])},!0);var x,b=this;this.renderTo.graph.addEventListener("mousemove",function(t){var e,i,o,n,a=t.offsetX,s=b.xToTime(a),r=b._binarySearch(s),l=b.getX,h=b.data,d=1/0;for(e=-1;e<2;e++)i=l(h[r+e][0]),(o=Math.abs(i-a))<d&&(n=r+e,d=o);x!==n&&(requestAnimationFrame(function(){b.showTooltip(n)}),x=n)}),this.renderTo.graph.addEventListener("mouseleave",function(t){b.hideTooltip(),x=null,t.stopPropagation()})};var e="Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),i=["January","February","March","April","May","June","Jule","August","September","October","November","December"].map(function(t){return t.substr(0,3)});i[8]="Sept",M.dateFormatter=function(t){return _instanceof(t,Date)||(t=new Date(t)),i[t.getMonth()]+" "+t.getDate()},M.weekDateFormatter=function(t){return _instanceof(t,Date)||(t=new Date(t)),e[t.getDay()]+", "+M.dateFormatter(t)},M.numberFormat=function(t){var e,i=t+"",o=[],n=i.length,a=n%3||3,s=a;for(o.push(i.substr(0,a)),a=3,e=s;e<n;e+=3)o.push(i.substr(e,a));return o.join(" ")};W=M.D;M.updateGraph=function(){var i={from:this._binarySearch(this.frame.from)-1,to:this._binarySearch(this.frame.to)+1},e=this._getMinMax(i.from,i.to);if(null===this.camera){this.camera={minMax:e,offset:this.data[0][0],AxisXGranule:864e5*Math.pow(2,Math.round(Math.log(Math.ceil((this.frame.to-this.frame.from)/6/864e5))/Math.log(2)))}}else.01<Math.abs(this.camera.minMax.max-e.max)&&this.update(),e.max=(5*this.camera.minMax.max+e.max)/6,e.delta=e.max-e.min,this.camera.minMax=e;var t=this.world.graph.width/this.consts.graphPxPerDot,o=this.frame.from,n=this.frame.to-o,a=n/t,s=this.data,r=this._getVisible(),l=this.world.graph.width,h=this.world.graph.height,d=this.getX=function(t){return(t-o)/n*l|0},c=this.getY=function(t){return h-(t-e.min)/e.delta*h|0},u=(this.xToTime=function(t){return t/l*n+o},r.map(function(t,e){return[[d(s[i.from][0]),c(s[i.from][r[e]+1])]]}));this.updateYAxis(e,c);var v,p,m,f,g,x,b,w=s[i.from][0];for(s[i.from];O=this.els.graphs.pop();)this.els.graph.removeChild(O);var y=[],M=r.map(function(){return-1/0});for(v=i.from+1,p=i.to;v<=p;v++)if(b=s[v],y.push(b),b[0]-w>=a){var L,_,C,D,E,T,A,S=y[(f=y.length)-1][0]-y[0][0]-.01,X=(y[f-1][0],y[0][0],y[0][0]);for(g=0,x=r.length;g<x;g++){for(L=0,_=r[g]+1,m=0;m<f;m++)L+=y[m][_];for(L/=f,T=-1,m=0;m<f;m++)C=(y[m][0]-X)/S,D=L-y[m][_],T<(E=Math.abs(C)*Math.abs(D))&&(T=E,A=y[m]);var k=d(A[0]);0,M[g]<k&&(M[g]=k,u[g].push([k,c(A[_])]))}w=b[0],b,v-=y.length/3|0,y.length=0}var G=this.consts.graphStrokeWidth;for(m=0,f=u.length;m<f;m++){var O=W.path({attr:{stroke:this.colors[this.columns[r[m]]],"stroke-width":G,"stroke-linejoin":"round",fill:"none",d:"M "+u[m].map(function(t){return t.join(" ")}).join(" L ")}});this.els.graphs.push(O),this.els.graph.appendChild(O)}this.updateXAxis()};W=M.D;M.updateNav=function(){var d=this,c=this.updateNavID=Math.random().toString(36).substr(2);this.world||this.collectWorldInfo();for(var t=this.world.nav.width/this.consts.previewPxPerDot,u=this.consts.navigationGraphStrokeWidth,v=this.minDate,p=this.maxDate-v,m=p/t,f=this.data,g=f[0][0],x=this._all,b=this.world.nav.width,w=this.world.nav.height,y=1,M=f.length,L=this._all.map(function(){return 0}),_=0,C=[],e=0,i=x.length;e<i;e++)C[e]={min:1/0,max:-1/0};var D=this._all.map(function(t,e){return[[0,f[0][e+1]]]});!function t(){if(c===d.updateNavID){for(var e=Math.min(M,y+1e4);y<e;y++){for(var i=f[y],o=0,n=x.length;o<n;o++){var a=C[o],s=i[o+1];s>a.max&&(a.max=s),s<a.min&&(a.min=s),L[o]+=s}if(_++,i[0]-g>=m){var r=(i[0]-v)/p*b|0;for(o=0,n=x.length;o<n;o++)D[o].push([r,L[o]/_]);g=i[0],L=d._all.map(function(){return 0}),_=0}}if(y<M)setTimeout(t,1);else{for(var l;l=d.els.navGraphs.pop();)d.els.nav.removeChild(l);for(d.minMaxes=C,o=0,n=D.length;o<n;o++){var h=C[o];l=W.path({renderTo:d.els.nav,attr:{stroke:d.colors[d.columns[x[o]]],"stroke-width":u,fill:"none",d:"M "+D[o].map(function(t){return t[0]+" "+(e=t[1],w-(e-0)/h.max*w|0);var e}).join(" L ")}}),d.els.navGraphs.push(l)}d.navGraphUpdateVisibility()}}}()},M.updateNavWindow=function(){var t=this.consts.resizeOffset,e=this.minDate,i=this.maxDate-e;if(null===this.frame.to){var o=this.data[this.data.length-1][0];this.frame={to:o,from:o+this.frame.from}}var n=(this.frame.from-e)/i*this.world.nav.width|0,a=(this.frame.to-this.frame.from)/i*this.world.nav.width|0;this.els.navWindow.style.left=n+"px",this.els.navWindow.style.width=a+"px";var s=this.els.navEars;s[0].style.width=n+"px",s[1].style.width=this.world.nav.width-n-a+"px",this.els.navMoveControl.style.width=a-t/2+"px",this.els.navMoveControl.style.left=n+t/4+"px",this.els.navExpandControl.style.width=a+t+"px",this.els.navExpandControl.style.left=n-t/2+"px"},M.navGraphUpdateVisibility=function(){var o=this,n=this._getVisible(),a={min:1/0,max:-1/0},s=this.minMaxes;this.els.navGraphs.forEach(function(t,e){-1===n.indexOf(e)?t.classList.add("hidden"):(t.classList.remove("hidden"),s[e].min<a.min&&(a.min=s[e].min),s[e].max>a.max&&(a.max=s[e].max))}),a.min=0,a.delta=a.max,this.els.navGraphs.forEach(function(t,e){if(-1!==n.indexOf(e)){var i=s[e].max/(1.1*a.max);t.style.transform="translateY("+o.world.nav.height*(1-i)+"px) scaleY("+i+")"}})};W=M.D;M.prototype={xToTime:function(){return 0},getX:function(){return 0},getY:function(){return 0},consts:{XAxisHeight:40,YAxisLabelPaddingBottom:6,previewPxPerDot:3,graphPxPerDot:3,navigationGraphStrokeWidth:1.5,graphStrokeWidth:3,LOG2:Math.log(2),resizeOffset:40},formatters:{date:M.dateFormatter,weekDate:M.weekDateFormatter},els:null,minDate:null,maxDate:null,world:null,_visible:null,_all:null,_forceUpdate:!0,init:function(){this.clear(),this.initDOM(),this.initListeners()},initCheckboxes:M.initCheckboxes,initDOM:M.initDOM,initListeners:M.initListeners,clear:function(){for(var t in this.camera=null,this.colors={},this.data=[],this.columns=[],this.els)if(this.els.hasOwnProperty(t)){var e=this.els[t];e.parentNode.removeChild(e)}this.els=null,this.world=null,this._visible=[]},load:function(t){this.colors=t.colors;var e=t.columns,i=this.data;this.names=t.names,console.log("Dots count:",e[0].length);for(var o=0,n=e.length;o<n;o++){var a=e[o];if(0<o&&this.columns.push(a[0]),0===o)for(var s=1,r=a.length;s<r;s++)i.push([a[s]]);else for(s=1,r=a.length;s<r;s++)i[s-1].push(a[s])}this.minDate=i[0][0],this.maxDate=i[i.length-1][0],this.initCheckboxes(),this._forceUpdate=!0,this.update(),setTimeout(this._update,100)},_getMinMaxRow:function(t,e,i){var o,n,a=this.data,s=1/0,r=-1/0;this._getVisible().length;for(o=t;o<=e;o++)(n=a[o][i+1])<s&&(s=n),r<n&&(r=n);var l=(r*=1.05)-(s=0);return r===-1/0?this.camera.minMax:{min:s,max:r,delta:l}},_getMinMax:function(t,e){var i,o,n,a,s=this.data,r=1/0,l=-1/0,h=this._getVisible(),d=h.length;for(i=t;i<=e;i++)for(n=s[i],o=0;o<d;o++)(a=n[h[o]+1])<r&&(r=a),l<a&&(l=a);var c=(l*=1.05)-(r=0);return l===-1/0?this.camera.minMax:{min:r,max:l,delta:c}},_getVisible:function(){return this._visible},updateNav:M.updateNav,navGraphUpdateVisibility:M.navGraphUpdateVisibility,updateNavWindow:M.updateNavWindow,_binarySearch:function(t){for(var e,i=this.data,o=0,n=i.length-1,a=Math.log(i.length)/this.consts.LOG2,s=0;s<a;s++)i[e=o+(n-o)/2|0][0]<t?o=e:i[e][0]>t&&(n=e);return e<1&&(e=1),e},updateYAxis:M.updateYAxis,updateXAxis:M.updateXAxis,updateGraph:M.updateGraph,update:function(){this.shouldUpdate||(this.shouldUpdate=!0,requestAnimationFrame(this._update))},_update:function(){this.shouldUpdate=!1,this._forceUpdate&&this.updateNav(),this.updateNavWindow(),this.updateGraph(),this._forceUpdate=!1},_removeTooltipCircles:function(){for(var t;t=this.els.highlightCircles.pop();)this.els.graph.removeChild(t)},showTooltip:function(t){var e,i,o,n,a=this.data[t],s=a[0],r=this._getVisible();this.els.tooltip.style.display="block",this._removeTooltipCircles(),W.removeChildren(this.els.tooltipInfo);var l=this.getX(s);for(e=0,i=r.length;e<i;e++)o=a[r[e]+1],n=this.columns[r[e]],this.els.highlightCircles.push(W.circle({attr:{stroke:this.colors[n],cx:l,cy:this.getY(o),r:6,"stroke-width":3},renderTo:this.els.graph})),this.els.tooltipInfo.appendChild(W.div({cls:"pcg-tooltip__info-item",style:{color:this.colors[n]}},W.div({cls:"pcg-tooltip__info-item__count"},M.numberFormat(o)),this.names[n]));this.els.tooltipDate.innerText=this.formatters.weekDate(s);var h=this.els.tooltip.style,d=this.els.tooltip.getClientRects()[0];this.els.verticalMouseSlice.style.left=l-1+"px",this.els.verticalMouseSlice.style.display="block";var c=l-d.width/3.5;c<1&&(c=1),c+d.width+1>this.world.graph.width&&(c=this.world.graph.width-d.width-1),h.left=c+"px"},hideTooltip:function(){this.els.tooltip.style.display="none",this.els.verticalMouseSlice.style.display="none",this._removeTooltipCircles()},collectWorldInfo:function(){var t=this.renderTo.nav.getClientRects()[0],e=this.renderTo.graph.getClientRects()[0];this.world={nav:{width:t.width,height:t.height},graph:{width:e.width,height:e.height-this.consts.XAxisHeight}}},resize:function(){var t=this;requestAnimationFrame(function(){t.collectWorldInfo(),t._forceUpdate=!0,t.update()})}}}();