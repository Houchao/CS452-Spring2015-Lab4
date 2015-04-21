
var canvas;
var gl;

var latitudeBands = 30;
var longitudeBands = 30;
var radius = 1.5;

var vertexPosition = [];
var vertexIndex = [];

var vertexNormalArray = [];


var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var normalMatrix, normalMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var near = -10;
var far = 10;
var theta  = 0.0;
var phi    = 0.0;
var dr = 0.8 * Math.PI/180.0;

var rotateTheta = 0.0;
var rotateThetaLoc;

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

// lighting property
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.8, 0.5, 0.6, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 10.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var textureCoordData = [];
var texture;
var program;

function SphereVertices()
{
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) 
	{
	      var theta = latNumber * Math.PI / latitudeBands;
	      var sinTheta = Math.sin(theta);
	      var cosTheta = Math.cos(theta);

	      for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) 
	      {
	        var phi = longNumber * 2 * Math.PI / longitudeBands;
	        var sinPhi = Math.sin(phi);
	        var cosPhi = Math.cos(phi);

	        var x = cosPhi * sinTheta;
	        var y = cosTheta;
	        var z = sinPhi * sinTheta;
                
                var u = 1 - (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands);
                
                textureCoordData.push(u);
                textureCoordData.push(v);
                
                vertexNormalArray.push(x);
                vertexNormalArray.push(y);
                vertexNormalArray.push(z);
                
	        vertexPosition.push(radius * x);
	        vertexPosition.push(radius * y);
	        vertexPosition.push(radius * z);
	      }
	 }
	
//	for(var i = 0; i < vertexPosition.length; i++)
//        {
//            console.log(vertexPosition[i]);
//        }
}

function IndexData()
{   
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) 
    {
      for (var longNumber = 0; longNumber < longitudeBands; longNumber++) 
      {
        var first = (latNumber * (longitudeBands + 1)) + longNumber;
        var second = first + longitudeBands + 1;
        vertexIndex.push(first);
        vertexIndex.push(second);
        vertexIndex.push(first + 1);

        vertexIndex.push(second);
        vertexIndex.push(second + 1);
        vertexIndex.push(first + 1);
      }
    }
//    for(var i = 0; i < index.length; i++)
//    {
//        console.log(index[i]);
//    }
}

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.752, 0.752, 0.752, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    SphereVertices();
    IndexData();
    
//    for(var i = 0; i < vertexNormalArray.length; i++)
//    {
//         console.log(vertexNormalArray[i]);
//    }

    //lighting start
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    //vertexNormalArray = utils.calculateNormals(vertexPosition, vertexIndex);
    
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertexNormalArray), gl.STATIC_DRAW );
    
    var vertexNormal = gl.getAttribLocation( program, "vertexNormal" );
    gl.vertexAttribPointer( vertexNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexNormal);
    
    //console.log(vertexNormal);
    
    
    var vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
    
    var vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);
       
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    
    //link shader program
    
    rotateThetaLoc = gl.getUniformLocation(program, "rotateTheta");
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    
//    document.getElementById("Button0").onclick = function(){theta += dr;};
//    document.getElementById("Button1").onclick = function(){theta -= dr;};
//    document.getElementById("Button2").onclick = function(){phi += dr;};
//    document.getElementById("Button3").onclick = function(){phi -= dr;};

    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(textureCoordData), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
    
    var image = document.getElementById("texImage");
 
    configureTexture( image );
    
    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    
//    set(modelViewMatrix, normalMatrix);
//    inverse(normalMatrix);
//    transpose(normalMatrix);
    
    rotateTheta += 0.5;
    gl.uniform1f(rotateThetaLoc, rotateTheta);
            
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) ); //pass new modelviewmatrix
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    //gl.drawArrays( gl.POINTS, 0, vertexPosition.length/3 );
       //console.log("runing");
    gl.drawElements(gl.TRIANGLES, vertexIndex.length, gl.UNSIGNED_SHORT, 0 ); //TRIANGLES
    window.requestAnimFrame(render);


}

