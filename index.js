var canvas = document.createElement('canvas');
var mousedown;
var draw_over_image = true;
canvas.width = window.innerWidth * .98;
canvas.height = window.innerHeight * .95;

document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');
var under_image, over_image, pixel_image;

function create_under_image(){
	var data = ctx.createImageData(canvas.width, canvas.height);
	return data;
}
function create_over_image(image){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	return data;
}
function draw_under_image(under_image){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.putImageData(under_image, 0, 0);
	if (draw_over_image){
		ctx.globalAlpha = .5;
		ctx.drawImage(pixel_image, 0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 1.0;
	}
}
function clamp_uint(num){
	if (num < 0){
		return 0;
	}
	else if (num > 255){
		return 255;
	}
	else return num;
}
function radial_falloff(cx, cy, x, y, radius){
	var dist_x = x - cx;
	var dist_y = y - cy;
	var dist_sq = Math.sqrt(dist_x * dist_x + dist_y * dist_y);
	var inv = 1.0 / dist_sq;

}

function draw_gaussian(x, y, under_image, over_image){
	var box_width = 200;
	var radius = box_width/2.0;
	var cx = x;
	var cy = y;
	x = x - radius; //offset it
	y = y - radius;
	var idx = y * (canvas.width * 4) + x * 4;

	for (var i = 0; i < box_width; i++){
		var new_idx = idx + i * (canvas.width * 4); //add the row
		for (var j = 0; j < box_width * 4; j+=4){ //4 because 4 pixels at a time are filled
			var x_pix = x + j/4;
			var y_pix = y + i;

			var spread = 20.0; //decreasing, increases spread
			//range, between 10 and 30

			//gaussian magic
			var sigma = radius/spread;
			var scale = radius/2.0;
			var x_alpha = 1.0 / (sigma * Math.sqrt(2 * Math.PI)) * Math.exp(-(Math.pow((x_pix-cx)/(2*sigma*sigma), 2)));
			var y_alpha = 1.0 / (sigma * Math.sqrt(2 * Math.PI)) * Math.exp(-(Math.pow((y_pix-cy)/(2*sigma*sigma), 2)));
			var alpha = x_alpha * y_alpha * scale;
			
			if (alpha < .01){
				//prevent drawing of black pixels
				continue;
			}
			under_image.data[new_idx+j] = over_image.data[new_idx+j] * alpha + under_image.data[new_idx+j] * (1.0 - alpha);
			under_image.data[new_idx+1+j] = over_image.data[new_idx+1+j] * alpha + under_image.data[new_idx+1+j] * (1.0-alpha);
			under_image.data[new_idx+2+j] = over_image.data[new_idx+2+j] * alpha  + under_image.data[new_idx+2+j] * (1.0 - alpha);

			//alpha values, set to 1
			under_image.data[new_idx+3+j] += 255 * alpha;

			//clamp the under images
			under_image.data[new_idx+j] = clamp_uint(under_image.data[new_idx+j]);
			under_image.data[new_idx+1+j] = clamp_uint(under_image.data[new_idx+1+j]);
			under_image.data[new_idx+2+j] = clamp_uint(under_image.data[new_idx+2+j]);
			under_image.data[new_idx+3+j] = clamp_uint(under_image.data[new_idx+3+j]);
		}
	}
	draw_under_image(under_image);
}
function draw_box(x, y, under_image, over_image){
	var box_width = 100;
	var radius = box_width/2.0;
	var cx = x;
	var cy = y;
	x = x - radius; //offset it
	y = y - radius;
	var idx = y * (canvas.width * 4) + x * 4;

	for (var i = 0; i < box_width; i++){
		var new_idx = idx + i * (canvas.width * 4); //add the row
		for (var j = 0; j < box_width * 4; j+=4){ //4 because 4 pixels at a time are filled
			var alpha = .1;
			under_image.data[new_idx+j] = over_image.data[new_idx+j] * alpha + under_image.data[new_idx+j] * (1.0 - alpha);
			under_image.data[new_idx+1+j] = over_image.data[new_idx+1+j] * alpha + under_image.data[new_idx+1+j] * (1.0-alpha);
			under_image.data[new_idx+2+j] = over_image.data[new_idx+2+j] * alpha  + under_image.data[new_idx+2+j] * (1.0 - alpha);

			//alpha values, set to 1
			under_image.data[new_idx+3+j] += 255 * alpha;

			//clamp the under images
			under_image.data[new_idx+j] = clamp_uint(under_image.data[new_idx+j]);
			under_image.data[new_idx+1+j] = clamp_uint(under_image.data[new_idx+1+j]);
			under_image.data[new_idx+2+j] = clamp_uint(under_image.data[new_idx+2+j]);
			under_image.data[new_idx+3+j] = clamp_uint(under_image.data[new_idx+3+j]);
		}
	}
	draw_under_image(under_image);
}
function load_image(path){
	var pixel_image = new Image();   // Create new img element
	pixel_image.addEventListener('load', function() {
	  // execute drawImage statements here
		over_image = create_over_image(pixel_image);
		draw_under_image(under_image);
	}, false);

	pixel_image.src = path; // Set source path
	return pixel_image;
}

function get_img_data(img){
	var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
	return img_data;
}

canvas.addEventListener( 'mousemove', function( event ) {
	var rect = canvas.getBoundingClientRect();
	var mouseX = event.clientX - rect.left;
	var mouseY = event.clientY - rect.top;
  	if (mousedown){
  		draw_gaussian(mouseX, mouseY, under_image, over_image); //hopefully populated?
 	}
});

canvas.addEventListener( 'mousedown', function( event ) {
    mousedown = true;
});
canvas.addEventListener( 'mouseup', function( event ) {
    mousedown = false;
});

function clamp_cycles(num, min, max){
	if (num < min){
		return min;
	}
	else if (num > max){
		return max;
	}
	else return num;
}

var num = 1;
document.body.onkeyup = function(e){
	if (e.keyCode == 32){
		draw_over_image = !draw_over_image;
		draw_under_image(under_image);
	}
    if (e.keyCode == 39){
    	var code = 'img' + num + '.jpg';
    	num++;
    	num = clamp_cycles(num, 1, 200); //clamp that shit
    	pixel_image = load_image(code);
    	draw_under_image(under_image);
    }
    if (e.keyCode == 37){
    	var code = 'img' + num + '.jpg';
    	num--;
    	num = clamp_cycles(num, 1, 200);
    	pixel_image = load_image(code);
    	draw_under_image(under_image);
    }
}
//begin actual exectuion
under_image = create_under_image();
pixel_image = load_image('img1.jpg');

