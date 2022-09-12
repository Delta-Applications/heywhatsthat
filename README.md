![HeyWhatsThat Logo](http://www.heywhatsthat.com/images/hwt-logo-293-58.jpg)
# heywhatsthat
HeyWhatsThat Client for KaiOS

## Planned Features
- View ID QR Code Insertion
- View Panorama with D-PAD https://www.heywhatsthat.com/results/{ViewID}/image_j.png 
- Request Panorama Creation for Current Location
- Request Random Popular Panorama
- View Point Coverage (w/ Leaflet?)
- View all peaks in Panorama


## What's HeyWhatsThat?
You hike to the top of a mountain or pull off at a scenic overlook. You see mountains in the distance. Which mountains are they? HeyWhatsThat will tell you, providing a 360° panoramic sketch labeled with the names of the peaks you're looking at. From almost anywhere in the world. 


## WIP D-PAD CODE SETSLICE
```javascript
var current = {
  mode: 'in',
  units: 0,
  df: 0,
  zoom: -1,
  left_edge: 0,
  slice: 0,	// left edge in degrees
  peak: -1,
  pixels_per_az_degree: 800 / 360,
  slice_width: 320 * 360 / 800,
  az_advance_per_click: 45,
  swing: 0,
  want_profile: 0
};

function set_slice(az) {
    az %= 360;
    if (az < 0) az += 360;
    current.slice = az;
    current.left_edge  = current.slice * current.pixels_per_az_degree;

    if (current.zoom == 1) {
	var imgl = $("img_in_left");
	var imgr = $("img_in_right");
	imgl.style.left = (-current.left_edge) + 'px';
	imgl.style.clip = 'rect(0px,' + (current.left_edge + 320) + 'px,160px,' + current.left_edge + 'px)';
	if (current.left_edge <= 800 - 320) {
	    imgr.style.display = 'none';
	} else {
	    imgr.style.display = 'block';
	    imgr.style.left = (800 - current.left_edge) + 'px';
	    imgr.style.clip = 'rect(0px,' + (320 - (800 - current.left_edge)) + 'px,160px,0px)';
	}
    } else {
	var imgl = $("img_out_left");
	var imgr = $("img_out_right");
	imgl.style.left = (-current.left_edge) + 'px';
	imgl.style.clip = 'rect(0px,320px,64px,' + current.left_edge + 'px)';
	if (current.left_edge == 0) {
	    imgr.style.display = 'none';
	} else {
	    imgr.style.display = 'block';
	    imgr.style.left = (320 - current.left_edge) + 'px';
	    imgr.style.clip = 'rect(0px,' + current.left_edge + 'px,64px,0px)';
	}
    }

    var last_az = az + current.slice_width;
    var p;
    for (p = 0; p < n_peaks2 && peaks[p].az < az; p++) ;
    if (p == n_peaks2 || peaks[p].az >= last_az) {
	current.slice_first_peak = -1;
	current.slice_last_peak = -1;
    } else {
	current.slice_first_peak = p;
	for (; p < n_peaks2 && peaks[p].az < last_az; p++) ;
	current.slice_last_peak = p - 1;
    }
}
```
