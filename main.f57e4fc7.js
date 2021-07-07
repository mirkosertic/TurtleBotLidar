parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"m4Di":[function(require,module,exports) {
"use strict";function t(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function e(t,e){for(var n=0;n<e.length;n++){var i=e[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(t,i.key,i)}}function n(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}Object.defineProperty(exports,"__esModule",{value:!0}),exports.Linesegment=exports.Point=void 0;var i=function(){function e(n,i){t(this,e),this.x=n,this.y=i}return n(e,[{key:"distanceTo",value:function(t){var e=t.x-this.x,n=t.y-this.y;return Math.sqrt(e*e+n*n)}},{key:"polarProjection",value:function(t,n){var i=Math.PI/180*t;return new e(this.x+Math.cos(i)*n,this.y+Math.sin(i)*n)}},{key:"translate",value:function(t,e){return this.x+=t,this.y+=e,this}}]),e}();exports.Point=i;var a=function(){function e(n,i){t(this,e),this.a=n,this.b=i}return n(e,[{key:"intersectionWith",value:function(t){var e=this.b.x-this.a.x,n=this.b.y-this.a.y,a=t.b.x-t.a.x,r=t.b.y-t.a.y,s=(-n*(this.a.x-t.a.x)+e*(this.a.y-t.a.y))/(-a*n+e*r),o=(a*(this.a.y-t.a.y)-r*(this.a.x-t.a.x))/(-a*n+e*r);if(s>=0&&s<=1&&o>=0&&o<=1)return new i(this.a.x+o*e,this.a.y+o*n)}}]),e}();exports.Linesegment=a;
},{}],"Ij9n":[function(require,module,exports) {
"use strict";function t(r){for(var a=0,e=0;0===a;)a=Math.random();for(;0===e;)e=Math.random();var o=Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*e);return(o=o/10+.5)>1||o<0?t():(o-.5)*r}Object.defineProperty(exports,"__esModule",{value:!0}),exports.gaussianNoise=t;
},{}],"EtCz":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.TurtleState=void 0;var e=require("./geom.js"),n=require("./noise");function t(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}function i(e,n){for(var t=0;t<n.length;t++){var i=n[t];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}function o(e,n,t){return n&&i(e.prototype,n),t&&i(e,t),e}var s=function(){function i(){t(this,i),this.location=new e.Point(56,56),this.theta=0,this.lidarLength=100,this.lidarNoise=0,this.lidarMinResolution=1,this.lidarSampleCount=0,this.walls=[new e.Linesegment(new e.Point(0,0),new e.Point(150,0)),new e.Linesegment(new e.Point(150,0),new e.Point(150,100)),new e.Linesegment(new e.Point(150,100),new e.Point(0,100)),new e.Linesegment(new e.Point(0,0),new e.Point(0,100)),new e.Linesegment(new e.Point(150,80),new e.Point(130,80)),new e.Linesegment(new e.Point(130,100),new e.Point(130,80))]}return o(i,[{key:"lidarFrame",value:function(){for(var t=[],i=[],o=0,s=this.theta;s<this.theta+360;s+=this.lidarMinResolution,o++){i[o]=s;for(var a=this.location.polarProjection(s,this.lidarLength),r=void 0,l=0;l<this.walls.length;l++){var c=this.walls[l].intersectionWith(new e.Linesegment(this.location,a));if(c){for(var h=this.location.distanceTo(c)+(0,n.gaussianNoise)(this.lidarNoise),u=0;u<this.lidarSampleCount;u++){h=(h+(this.location.distanceTo(c)+(0,n.gaussianNoise)(this.lidarNoise)))/2}r?r.distance>h&&(r={distance:h,intersection:c}):r={distance:h,intersection:c}}}r&&(t[o]=r.distance)}return{angles:i,distances:t}}}]),i}();exports.TurtleState=s;
},{"./geom.js":"m4Di","./noise":"Ij9n"}],"hLFY":[function(require,module,exports) {
"use strict";function e(e,r,t){return e<0?e+=t:e>=t&&(e-=t),r[e]}function r(r,t,o){for(var i=[],n=0;n<t;n++){var u=e(n,r,t),s=e(n+o,r,t);u&&s&&(i[n]=s-u)}return i}Object.defineProperty(exports,"__esModule",{value:!0}),exports.derivativeOf=r,exports.positionOverflowingValueFrom=e;
},{}],"d6sW":[function(require,module,exports) {
"use strict";var t=require("./geom.js"),e=require("./noise.js"),a=require("./envsim.js"),l=require("./derivative.js"),o=document.getElementById("rendering"),r=o.getContext("2d");r.lineWidth=1,r.strokeStyle="black",r.fillStyle="black",r.scale(2,2),r.translate(100,100);var i=new a.TurtleState,n={particles:[{location:new t.Point(0,0),theta:0,score:1,uncertainty:Math.pow(10,2)}],estimatedState:function(){for(var e=void 0,a=void 0,l=void 0,o=void 0,r=0;r<this.particles.length;r++){var i=this.particles[r];e=e?(e+i.location.x)/2:i.location.x,a=a?(a+i.location.y)/2:i.location.y,l=l?(l+i.theta)/2:i.theta,o=o?(o+i.uncertainty)/2:i.uncertainty}return{location:new t.Point(e,a),theta:l,uncertainty:o}},features:[],featureDetectionRadius:3,moveTurtleBy:function(t,a){for(var l=0;l<this.particles.length;l++){var o=this.particles[l];o.location.translate(t+(0,e.gaussianNoise)(3),a+(0,e.gaussianNoise)(3)),o.uncertainty=Math.pow(10,2)}this.particles=this.particles.concat([])},rotateTurtle:function(t){for(var e=0;e<this.particles.length;e++){var a=this.particles[e];a.theta+=t,a.uncertainty=Math.pow(10,2)}this.particles=this.particles.concat([])},updateParticleState:function(e){var a=n.estimatedState();if(0===this.features.length)for(var l=0;l<e.length;l++){var o=e[l];this.features.push({uncertainty:Math.pow(10,2),location:a.location.polarProjection(o.angle+a.theta,o.distance)})}else{for(var i=0;i<this.particles.length;i++){var s=this.particles[i];s.score=0;for(var c=0;c<this.features.length;c++)for(var h=this.features[c],y=0;y<e.length;y++){var f=e[y],v=new t.Point(0,0).polarProjection(f.angle+s.theta,f.distance).translate(s.location.x,s.location.y);if(r.beginPath(),r.strokeStyle="gray",r.fillStyle="gray",r.arc(56+v.x,200+v.y,8,0,2*Math.PI),r.stroke(),r.closePath(),v.distanceTo(h.location)<10){f.identified=!0,r.beginPath(),r.strokeStyle="blue",r.fillStyle="blue",r.arc(56+v.x,200+v.y,6,0,2*Math.PI),r.stroke(),r.closePath(),s.score+=1;var g=h.location.distanceTo(s.location),u=a.uncertainty/(a.uncertainty+f.uncertainty);s.uncertainty=(1-u)*a.uncertainty;var P=g+u*(f.distance-g),k=s.location;s.location=h.location.polarProjection(f.angle+s.theta+180,P),h.location=k.polarProjection(f.angle+s.theta,P)}}}for(var d=void 0,S=0;S<this.particles.length;S++)d=d?(d+this.particles[S].score)/2:this.particles[S].score;this.particles=this.particles.filter(function(t,a,l){return t.score>=d||(console.log("Particle "+a+" got score "+t.score+" from "+e.length+" and will be removed!"),!1)})}}};function s(t,e,a,l){var o=t.polarProjection(e,a);r.strokeStyle=l,r.fillStyle=l,r.beginPath(),r.moveTo(t.x,t.y),r.lineTo(o.x,o.y),r.stroke(),r.closePath()}function c(t,e,a,l,o,i,n,s,c){for(var h=0;h<o;h++){var y=l[h];if(y){var f=t+(h+i)%o,v=e,g=v+y*n;r.beginPath(),r.strokeStyle=a,r.fillStyle=a,r.moveTo(f,v),r.lineTo(f,g),r.stroke(),r.closePath()}}r.save(),r.beginPath(),r.strokeStyle="black",r.fillStyle="black",r.moveTo(t,e-c),r.lineTo(t,e+c),r.translate(t,e),r.rotate(-Math.PI/2),r.textAlign="center",r.font="8px Arial",r.fillText(s,0,-5),r.stroke(),r.closePath(),r.restore()}function h(){r.clearRect(-100,-100,1e3,1e3),r.strokeStyle="black",r.fillStyle="black",r.textAlign="left",r.font="8px Arial",r.fillText("Reality",-20,-20),r.strokeStyle="black",r.fillStyle="black",r.beginPath();for(var e=0;e<i.walls.length;e++){var a=i.walls[e];r.moveTo(a.a.x,a.a.y),r.lineTo(a.b.x,a.b.y)}r.stroke(),r.closePath(),r.beginPath(),r.strokeStyle="gray",r.fillStyle="gray",r.arc(i.location.x,i.location.y,8,0,2*Math.PI),r.stroke(),r.closePath(),s(i.location,i.theta,20,"green"),r.strokeStyle="black",r.fillStyle="black",r.textAlign="left",r.font="8px Arial",r.fillText("Turtles model no.F. = "+n.features.length+", no. P = "+n.particles.length,-20,120);for(var o=0;o<n.particles.length;o++){var h=n.particles[o];r.beginPath(),r.strokeStyle="gray",r.fillStyle="gray",r.arc(h.location.x+56,h.location.y+200,8,0,2*Math.PI),r.stroke(),r.closePath(),s(new t.Point(h.location.x+56,h.location.y+200),h.theta,20,"green"),r.strokeStyle="black",r.fillStyle="black",r.textAlign="left",r.font="8px Arial",r.fillText("Uncertainty:",h.location.x+46,h.location.y+170),r.fillText(h.uncertainty.toPrecision(4),h.location.x+46,h.location.y+180)}for(var y=0;y<n.features.length;y++){var f=n.features[y];r.beginPath(),r.strokeStyle="red",r.fillStyle="red",r.arc(f.location.x-1+56,f.location.y-1+200,3,0,2*Math.PI),r.stroke(),r.closePath()}for(var v=i.lidarFrame(),g=v.angles.length,u=v.distances,P=v.angles,k=360/i.lidarMinResolution,d=k/2,S=0;S<g;S+=1){var p=i.location.polarProjection(S+i.theta,i.lidarLength),b=u[S];if(b){var x=i.location.polarProjection(S+i.theta,b);r.beginPath(),r.strokeStyle="CadetBlue",r.fillStyle="CadetBlue",r.arc(x.x,x.y,2,0,2*Math.PI),r.stroke(),r.closePath(),r.beginPath(),0===g?(r.strokeStyle="green",r.fillStyle="green"):(r.strokeStyle="CadetBlue",r.fillStyle="CadetBlue");var T=200+(S+d)%k,m=50-b;r.moveTo(T,50),r.lineTo(T,m),r.stroke(),r.closePath()}else r.strokeStyle="rgba(128,128,128,0.05)",r.fillStyle="rgba(128,128,128,0.05)",r.beginPath(),r.moveTo(i.location.x,i.location.y),r.lineTo(p.x,p.y),r.stroke(),r.closePath()}r.save(),r.beginPath(),r.strokeStyle="black",r.fillStyle="black",r.moveTo(200,50),r.lineTo(200,-70),r.translate(200,50),r.rotate(-Math.PI/2),r.textAlign="center",r.font="8px Arial",r.fillText("Lidar distance",60,-5),r.stroke(),r.closePath(),r.restore();var w=(0,l.derivativeOf)(u,g,1),M=(0,l.derivativeOf)(w,g,1);c(200,90,"DarkSlateGrey",w,k,d,3,"1st derivative",20),c(200,160,"DarkSlateGrey",M,k,d,15,"2nd derivative",20);for(var A=[],I=0;I<g;I++){var j=(0,l.positionOverflowingValueFrom)(I,w,k),B=(0,l.positionOverflowingValueFrom)(I-1,w,k),F=(0,l.positionOverflowingValueFrom)(I,M,k),q=!1;j&&B&&F&&(B>=0&&j<0?q=!0:B<0&&j>.45&&(q=!0));var C=u[I];if(q&&C){var O=P[I],R=i.location.polarProjection(O,C);A.push({angle:O-i.theta,distance:C,uncertainty:Math.pow(5,2)}),r.beginPath(),r.strokeStyle="red",r.fillStyle="red",r.arc(R.x,R.y,2,0,2*Math.PI),r.stroke(),r.closePath(),r.strokeStyle="lightgray",r.fillStyle="lightgray",r.beginPath(),r.moveTo(i.location.x,i.location.y),r.lineTo(R.x,R.y),r.stroke(),r.closePath();var D=200+(I+d)%k,L=90,V=L-w[I];r.beginPath(),r.strokeStyle="red",r.fillStyle="red",r.arc(D,V,2,0,2*Math.PI),r.stroke(),r.closePath(),D=200+(I+d)%k,V=(L=50)-u[I],r.beginPath(),r.strokeStyle="red",r.fillStyle="red",r.arc(D,V,2,0,2*Math.PI),r.stroke(),r.closePath()}}n.updateParticleState(A)}function y(){h(),window.requestAnimationFrame(y)}window.requestAnimationFrame(y),window.addEventListener("keydown",function(t){if("ArrowUp"===t.key){var e=3*Math.cos(Math.PI/180*i.theta),a=3*Math.sin(Math.PI/180*i.theta);i.location.translate(e,a),n.moveTurtleBy(e,a)}if("ArrowDown"===t.key){var l=-3*Math.cos(Math.PI/180*i.theta),o=-3*Math.sin(Math.PI/180*i.theta);i.location.translate(l,o),n.moveTurtleBy(l,o)}"ArrowLeft"===t.key&&(i.theta-=2,n.rotateTurtle(-2)),"ArrowRight"===t.key&&(i.theta+=2,n.rotateTurtle(2))});
},{"./geom.js":"m4Di","./noise.js":"Ij9n","./envsim.js":"EtCz","./derivative.js":"hLFY"}]},{},["d6sW"], null)
//# sourceMappingURL=main.f57e4fc7.js.map