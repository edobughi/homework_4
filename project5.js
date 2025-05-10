// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{	
	// [TO-DO] Modify the code below to form the transformation matrix.

	cos1=Math.cos(rotationX)
	sen1=Math.sin(rotationX);

	cos2=Math.cos(rotationY);
	sen2=Math.sin(rotationY)

	var rotX=[1,0,0,0,
		0,cos1, sen1,0,
		0,-sen1, cos1,0,
		0,0,0,1
	];

	var rotY=[cos2,0,-sen2,0,
		0,1,0,0,
		sen2,0,cos2,0,
		0,0,0,1
	];	

	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var temp1=MatrixMult(rotY, rotX);
	var mv=MatrixMult(trans,temp1);
	
	return mv;
}

var VS = `
attribute vec3 pos;
attribute vec3 norm;
attribute vec2 texCoord;
uniform mat4 mvp;
uniform mat4 mv;
uniform mat3 mvn;
uniform bool swapYz;
varying vec2 vTexCoord;
varying vec3 norm_;
varying vec3 pos_;

void main(){
	vec4 position=vec4(pos,1.0);
	if ( !swapYz){
			gl_Position = mvp * vec4(pos, 1);
			norm_ = normalize(mvn * norm);
			pos_ = vec3(mv * vec4 ( pos, 1 ) );

	}else {
			gl_Position = mvp * mat4(
				1.0, 0.0, 0.0, 0.0,
				0.0, 0.0, -1.0, 0.0,
				0.0, 1.0, 0.0, 0.0,
				0.0, 0.0, 0.0, 1.0
			) * vec4( pos, 1);
			pos_ = vec3(mv * mat4(
				1.0, 0.0, 0.0, 0.0,
				0.0, 0.0, -1.0, 0.0,
				0.0, 1.0, 0.0, 0.0,
				0.0, 0.0, 0.0, 1.0
				)* vec4( pos, 1 ) );
			norm_ = normalize(mvn * mat3(
				1, 0, 0, 
				0, 0, -1,
				0, 1, 0
				) * norm );
		}
	vTexCoord=texCoord;
}
`;
var FS = `
	precision mediump float;
	varying vec2 vTexCoord;
	uniform sampler2D texSampler;
	uniform bool showTexture;
	uniform float alpha;
	uniform vec3 light;
	varying vec3 norm_;
	varying vec3 pos_;

	void main(){

		vec3 n_light= normalize(light);
		float l_light = length(light);
		vec3 n_norm = normalize(norm_);
		vec3 n_pos = normalize(pos_);
		vec3 n_n_light = normalize(n_light + n_pos);
		if(showTexture){
			gl_FragColor=texture2D(texSampler, vTexCoord);
		}else{
			gl_FragColor = vec4(0.4 , 0.0 , 0.9 , 1.0);
		}	
		gl_FragColor= l_light * (max ( dot(n_light, n_norm), 0.0 ) + pow( max(dot( n_n_light, n_norm ), 0.0), alpha )) *gl_FragColor;
}
`;
// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.shaderProgram = InitShaderProgram( VS, FS );
		gl.useProgram(this.shaderProgram);
        this.texture=gl.createTexture();
	
		this.positionAttribLocation = gl.getAttribLocation(this.shaderProgram, "pos");
		this.texCoordsAttribLocation = gl.getAttribLocation(this.shaderProgram, "texCoord");
        this.normalAtribLocation = gl.getAttribLocation(this.shaderProgram, "norm");

		this.mvpUniformLocation = gl.getUniformLocation(this.shaderProgram, "mvp");
		this.swapYZUniformLocation = gl.getUniformLocation(this.shaderProgram,"swapYz");
		this.showTextureUniform = gl.getUniformLocation(this.shaderProgram, "showTexture");
		this.mvUniformLocation = gl.getUniformLocation(this.shaderProgram, "mv");
		this.mvnUniformLocation= gl.getUniformLocation(this.shaderProgram, "mvn");
		this.lightUniformLocation = gl.getUniformLocation(this.shaderProgram, "light");
		this.alphaUniformLocation = gl.getUniformLocation(this.shaderProgram, "alpha");
        this.texSamplerUniform = gl.getUniformLocation(this.shaderProgram, "texSampler");

		gl.uniform1i(this.showTextureUniform,false);
		gl.uniform1i(this.swapYZUniformLocation, false);

		this.vertexBufferPos = gl.createBuffer();
		this.vertexBufferTex = gl.createBuffer();
		this.vertexBufferNrm = gl.createBuffer();
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
		gl.useProgram(this.shaderProgram);

		//update vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferPos);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferTex);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferNrm);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.shaderProgram);
		gl.uniform1i(this.swapYZUniformLocation, swap);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.shaderProgram);

		gl.uniformMatrix4fv(this.mvpUniformLocation, false, matrixMVP);
		gl.uniformMatrix4fv(this.mvUniformLocation, false, matrixMV);
		gl.uniformMatrix3fv(this.mvnUniformLocation, false, matrixNormal);

		gl.bindBuffer(gl.ARRAY_BUFFER,this.vertexBufferPos);
		gl.enableVertexAttribArray(this.positionAttribLocation);
		gl.vertexAttribPointer(this.positionAttribLocation , 3 , gl.FLOAT , false , 0 , 0 );

		gl.bindBuffer(gl.ARRAY_BUFFER,this.vertexBufferTex);
		gl.enableVertexAttribArray(this.texCoordsAttribLocation);
		gl.vertexAttribPointer(this.texCoordsAttribLocation , 2 , gl.FLOAT , false , 0 , 0 );

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferNrm);
		gl.enableVertexAttribArray(this.normalAtribLocation);
		gl.vertexAttribPointer(this.normalAtribLocation , 3 , gl.FLOAT , false , 0 , 0 );

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		gl.useProgram(this.shaderProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		gl.generateMipmap(gl.TEXTURE_2D);

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

		gl.uniform1i(this.texSamplerUniform , 0 );
		gl.uniform1i(this.showTextureUniform , true );
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.shaderProgram);
		gl.uniform1f(this.showTextureUniform , show );
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.shaderProgram);
		gl.uniform3f(this.lightUniformLocation, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.shaderProgram);
		gl.uniform1f(this.alphaUniformLocation, shininess);
	}
}
