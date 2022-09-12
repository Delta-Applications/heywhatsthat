
































































































































































































var $m = google.maps;
function $(id) { return document.getElementById(id); }
function $$(id) { return document.getElementById(id).style; }
Array.prototype._foreach = function(f, i) { for (var __i = 0; __i < this.length; __i++) f(this[__i], __i); };

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

var map;
var contoursMapType;
var infowindow;
var home_latlng;
var controls = {};

var n_peaks  = 5;
var n_peaks2 = 10;
var peaks    = [{ name: "Serra Dolcedorme", az: 229.958829,       range: 107397.426132, ok_elev: 2267.000000 || 2249.000000, lat: 39.894167, lon: 16.215833 },
{ name: "Monte del Papa", az: 249.037834,       range: 124628.347179, ok_elev: 0.000000 || 1990.000000, lat: 40.131667, lon: 15.832500 },
{ name: "Monte Raparo", az: 250.962926,       range: 109853.769293, ok_elev: 0.000000 || 1747.000000, lat: 40.204167, lon: 15.985000 },
{ name: "Monte Santa Trinità", az: 295.376254,       range: 36169.982100, ok_elev: 411.000000 || 408.000000, lat: 40.626667, lon: 16.858333 },
{ name: "Monte Sant’Elia", az: 330.352408,       range: 22801.009393, ok_elev: 0.000000 || 444.000000, lat: 40.652500, lon: 17.114167 },
{ name: "Serra Dolcedorme", az: 229.958829 + 360, range: 107397.426132, ok_elev: 2267.000000 || 2249.000000, lat: 39.894167, lon: 16.215833 },
{ name: "Monte del Papa", az: 249.037834 + 360, range: 124628.347179, ok_elev: 0.000000 || 1990.000000, lat: 40.131667, lon: 15.832500 },
{ name: "Monte Raparo", az: 250.962926 + 360, range: 109853.769293, ok_elev: 0.000000 || 1747.000000, lat: 40.204167, lon: 15.985000 },
{ name: "Monte Santa Trinità", az: 295.376254 + 360, range: 36169.982100, ok_elev: 411.000000 || 408.000000, lat: 40.626667, lon: 16.858333 },
{ name: "Monte Sant’Elia", az: 330.352408 + 360, range: 22801.009393, ok_elev: 0.000000 || 444.000000, lat: 40.652500, lon: 17.114167 }];

var pan_name = "Requested 9/11 12:43pm";


function load() {
    set_units(read_cookie('units') - 0);
    set_degrees_format(read_cookie('df') - 0);
    current.slice = 0;
    // preload_images(['pan_top_pan.png', 'pan_top_list.png', 'pan_top_details.png', 'left-1-hi.png', 'left-2-hi.png', 'right-1-hi.png', 'right-2-hi.png']);

    home_latlng = new $m.LatLng(40.4675, 17.23083);
    map = new $m.Map($('map_div'), {
      zoom: 7,
      center: home_latlng,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      panControl: false,
      zoomControl: true,
      zoomControlOptions: { style: google.maps.ZoomControlStyle.SMALL },
      //mapTypeControl: false,
      mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
      scaleControl: true,
      streetViewControl: false,
      //streetViewControlOptions: { position: $m.ControlPosition.BOTTOM_CENTER },
      overviewMapControl: false
    });

    contoursMapType = new $m.ImageMapType({
      getTileUrl: function(coord, zoom) { return 'https://contour.heywhatsthat.com/bin/contour_tiles.cgi?x=' + coord.x + '&y=' + coord.y + '&zoom=' + zoom },
      tileSize: new google.maps.Size(256, 256),
      isPng: true
    });

    infowindow = new $m.InfoWindow();

    controls.cloak    = new TControl('Cloak', 'click for viewshed', 1, $m.ControlPosition.TOP_RIGHT, toggle_cloak);
    controls.contours = new TControl('Contours', 'click to add contours to the map', 1, $m.ControlPosition.TOP_RIGHT, toggle_contours);
    controls.profile  = new TControl('Profile', 'click here then click on the map to get elevation profile', 1, $m.ControlPosition.TOP_RIGHT, function() { explain_profile(); current.want_profile = 1;});
    $m.event.addListener(map, 'click', function(e) { if (current.want_profile) { current.want_profile = 0; show_profile(e.latLng.lat(), e.latLng.lng()); }});

    var viewer_marker_image = new $m.MarkerImage('orchid-x.png');
    viewer_marker_image.anchor = new $m.Point(12, 12);
    current.viewer_marker = new $m.Marker({ position: home_latlng, map: map, title: 'Viewer', icon: viewer_marker_image })
    $m.event.addListener(current.viewer_marker, 'click', function() { show_viewer() });

		// add fields used by map. note we don't bother with the second copies (those with index n_peaks .. 2*n_peaks-1)
    for (var i = 0; i < n_peaks; i++) {
      var p = peaks[i];
      p.index = i;
      p.latlng = new $m.LatLng(p.lat, p.lon);
      p.marker = new $m.Marker({ position: p.latlng, map: map, title: p.name, icon: 'small-red-triangle.png' });  // animation: $m.Animation.DROP
      $m.event.addListener(p.marker, 'click', f_select_map_peak(p));
    }

	// RENAME_WITH_PARAM
    //if ("" != "") {
    //   setTimeout(function() { alert("Renamed from '' to 'Requested 9/11 12:43pm'"); }, 100);
    //}

    set_mode('in');
    if (n_peaks == 0) {
       set_peak_text_no_peaks();
    } else {
       goto_peak(-1);
    }
    init_swing();
    show_cloak();
    setTimeout(function() { scrollTo(0,60) }, 100);
}

function f_select_map_peak(p) {
  return function() { select_map_peak(p) };
}

/********
function pan_top_click(x, y) {
  if (y < 5 || y > 33 || x < 28 || x > 288)
    return;
  var to = ['pan', 'list', 'details'][Math.floor((x - 28)/87)];
  if (current.mode != to)
    set_mode(to);
}
*********/

var list_click_goes_to = 'in';
var map_hit = 0;

function set_mode(m) {
  if (m == 'list' && current.mode != 'list')
    list_click_goes_to = current.mode;

  current.mode = m;
  switch (m) {
    case 'in' :
      if (current.zoom != 1)
        set_zoom(1);
      if (current.swing)
        start_compass_listener();
      m = 'pan';
      break;

    case 'out':
      if (current.zoom != 0)
        set_zoom(0);
      if (current.swing)
        start_compass_listener();
      m = 'pan';
      break;

    case 'list':
      div_on('list_div');  // do this now so we can scroll
      stop_compass_listener();
      var i = current.peak;
      if (i >= n_peaks)
        i -= n_peaks;
      if (i <= 3)
	scrollTo(0, 0);
      else
        scrollTo(0, i * 60 - 120); // NOTE: depends on list spacing
      break;

    case 'map':
      current.want_profile = 0
      stop_compass_listener();
      infowindow.close();
      div_on('map_div');
      if (!map_hit) {
        $m.event.trigger(map, 'resize');
        map.setCenter(current.peak == -1? home_latlng : peaks[current.peak].latlng);
        map_hit = 1;
      }
      break;

    // case 'profile':
  }

  div_on(m + '_div');
  $('pan_top_pan').removeAttribute("selected");
  $('pan_top_map').removeAttribute("selected");
  $('pan_top_list').removeAttribute("selected");
  $('pan_top_details').removeAttribute("selected");
  $('pan_top_' + m).setAttribute("selected", "true");
}


function delete_pan() {
  if (confirm("Remove " + pan_name + "?"))
    do_delete();
  //WhereUI.showMenu([ new WhereMenuItem("Remove " + pan_name, 'do_delete()') ]);
}

function do_delete() {
  do_req('bin-remove.cgi?id=JFT8X46T', function() { history.back() }, "Remove failed.");
}

function rename_pan() {
  var new_name = document.f_rename.name.value;
  if (new_name == '' || new_name == 'Enter new name ...') {
      alert("You must enter a name");
      return;
  }
  do_req('bin-rename.cgi?id=JFT8X46T&new_name=' + new_name, rename_succeeded, "Rename failed.");
  document.f_rename.name.blur();
}


/********
			// RENAME_WITH_PARAM
function rename_succeeded() {
    location.href = location.href + '&old_name=' + pan_name;
}

			// RENAME_WITHOUT_RT
function rename_succeeded(s) {
    var a = s.match(/[\r\n]([^\r\n]*)/);
    if (a != null && a[1] != '') {
	$('pan_top_title').innerHTML = a[1];
	WhereUI.alert("'" + pan_name + "' renamed to '" + a[1] + "'");
	pan_name = a[1];
    } else {
	WhereUI.alert('Rename failed.');
    }
}
************/


function rename_succeeded() {
    location.reload(true);
}


function do_req(url, f, fail_message) {
  req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200)
      if (req.responseText == 0)
	alert(fail_message);
      else
	f(req.responseText);
  };

  req.open("GET", url, true);
  req.send(null);
}


function set_zoom(zoom) {
	// we either display the whole pan at once (zoom == 0) or pixel per pixel (zoom == 1)
    current.zoom = zoom;
    if (current.zoom == 1) {
	$("img_in_left").style.display   = 'block';
	$("img_out_left").style.display  = 'none';
	$("img_out_right").style.display = 'none';
	current.pixels_per_az_degree = 800 / 360;
	current.slice_width = 320 / current.pixels_per_az_degree;
	current.az_advance_per_click = 45;

    } else {
	$("img_out_left").style.display  = 'block';
	$("img_in_left").style.display   = 'none';
	$("img_in_right").style.display  = 'none';
	current.pixels_per_az_degree = 320 / 360;
	current.slice_width = 360;
	current.az_advance_per_click = 90;
    }
    set_slice(current.slice);
    set_peak(current.slice_first_peak);
}


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

function set_peak(p) {
    if (n_peaks == 0) {
	current.peak = -1;
	return;
    }
    if (p == -1 || p < current.slice_first_peak || p > current.slice_last_peak) {
	current.peak = -1;
	clear_peak_text();
	unset_mark();
	unhighlight_peak_row();
        unhighlight_peak_marker();
    } else {
	current.peak = p;
	var pp = peaks[p];
	set_peak_text(pp);
	set_mark(pp.az);
	highlight_peak_row();
	highlight_peak_marker();
    }
}

function first_going_right() {
    if (current.zoom == 0)
	return current.slice_first_peak;

    var p = current.slice_first_peak;
    if (p == -1)
	return -1;
    var lastp = current.slice_last_peak;
    var az = current.slice - current.az_advance_per_click + current.slice_width;
    for (; p < lastp && peaks[p].az < az; p++);
    return p;
}

function first_going_left() {
    if (current.zoom == 0)
	return current.slice_last_peak;

    var p = current.slice_last_peak;
    if (p == -1)
	return -1;
    var firstp = current.slice_first_peak;
    var az = current.slice + current.az_advance_per_click;
    for (; p > firstp && peaks[p].az >= az; p--) ;
    return p;
}

function at_az(az) {
    var p = current.slice_first_peak;
    if (p == -1)
	return -1;
    //az = Math.round(az);  No, az is already rounded
    var lastp = current.slice_last_peak;
    for (; p <= lastp && peaks[p].az <= az + 1; p++)
      if (Math.round(peaks[p].az) == az)
	return p;
    return -1;
}

function nearest_center() {
    return nearest_to_az(current.slice + current.slice_width / 2);
}

function nearest_to_az(az) {
    var p = current.slice_first_peak;
    if (p == -1)
	return -1;
    if (peaks[p].az >= az)
	return p;
    var lastp = current.slice_last_peak;
    if (peaks[lastp].az <= az)
	return lastp;
    for (; p < lastp && peaks[p].az < az; p++);
	// is previous peak closer?
    if (az - peaks[p-1].az < peaks[p].az - az)
	p--;
    return p;
}



function go_right() {
    if (current.peak == -1 || current.peak >= current.slice_last_peak) {
	set_slice(current.slice + current.az_advance_per_click);
	set_peak(first_going_right());
    } else {
	set_peak(current.peak + 1);
    }
}

function go_left() {
        // note this includes current.peak == -1
    if (current.peak <= current.slice_first_peak) {
	set_slice(current.slice - current.az_advance_per_click);
	set_peak(first_going_left());
    } else {
	set_peak(current.peak - 1);
    }
}

function scroll_right() {
    set_slice(current.slice + current.az_advance_per_click);
    set_peak(nearest_center());
}

function scroll_left() {
    set_slice(current.slice - current.az_advance_per_click);
    set_peak(nearest_center());
}


/******* 
// on the iphone we can't drag the pan, so on a click
// move the clicked spot to the center, then find nearest peak
function center(x) {
    set_slice(current.slice + x / current.pixels_per_az_degree - current.slice_width / 2);
    set_peak(nearest_center());
}
*********/

function find_peak_on_pan(x) {
    set_peak(nearest_to_az(current.slice + x / current.pixels_per_az_degree));
}

var compass_last_x;

function init_swing() {
	    // html5rocks.com/en/tutorials/device/orientation
  if (!window.DeviceOrientationEvent)
    return;
  $('swing_div').style.display = '';
  set_swing(0);
}

function set_swing(swing) {
  current.swing = swing;
  $('swing_box').checked = swing;
  if (swing)
    start_compass_listener();
  else
    stop_compass_listener();
}

function start_compass_listener() {
  compass_last_x = null;

		//NOTE: iphone 3gs, though it has compass and window.DeviceOrientationEvent, doesn't seem to trigger these
  window.addEventListener('deviceorientation', compass_listener, false);
}
  
function stop_compass_listener() {
  window.removeEventListener('deviceorientation', compass_listener, false);
}

function compass_listener(event) {
  var x;

  //if (compass_last_x == null)
  //  alert('alpha ' + event.alpha + ' ch ' + event.compassHeading + ' last ' + compass_last_x);

  if (event.compassHeading != null)
    x = event.compassHeading;
  else if (event.alpha != null)
    x = 360 - event.alpha;
  else
    return;
  x = Math.round(x);
  if (x == compass_last_x)
    return;
  compass_last_x = x;

  set_slice(x - current.slice_width / 2);
  if ((p = at_az(x)) != -1)
    set_peak(p);
  else {
    set_peak(-1);
    set_peak_text_az_only(x);
    set_mark(x);
  }
}


function unset_mark() {
    $('silmarker').style.display = 'none';
}

function set_mark(x) {
    var s = $('silmarker').style;
    s.left = x * current.pixels_per_az_degree - current.left_edge;
    s.display = 'block';
}

function clear_peak_text() {
    $('peak_data_name').innerHTML = '';
    $('peak_data_az').innerHTML = '';
    $('peak_data_range').innerHTML = '';
    $('peak_data_elev').innerHTML = '';
}

function set_peak_text(p) {
    $('peak_data_name').innerHTML = p.name;
    $('peak_data_az').innerHTML = 'bearing ' + pretty_az(p.az, 1);
    $('peak_data_range').innerHTML = pretty_miles_or_km(p.range, 1) + ' away';
    $('peak_data_elev').innerHTML = p.ok_elev? pretty_feet_or_meters(p.ok_elev, 1) + ' high' : '';
}

function set_peak_text_az_only(az) {
    $('peak_data_az').innerHTML = 'bearing ' + pretty_az(az, 1);
}

function set_peak_text_no_peaks() {
    $('peak_data_name').innerHTML = '';
    $('peak_data_az').innerHTML = 'No peaks found.';
    $('peak_data_range').innerHTML = 'Click <span onclick="set_mode(\'details\')"><i>Details</i></span>';
    $('peak_data_elev').innerHTML = 'for more information';
}

var last_highlighted_peak = -1;

function unhighlight_peak_row() {
  if (last_highlighted_peak >= 0) {
    $('peak_li_' + last_highlighted_peak).removeAttribute('selected');
    last_highlighted_peak = -1;
  }
}

function highlight_peak_row() {
  if (current.peak == last_highlighted_peak)
    return;
  unhighlight_peak_row();
  if (current.peak >= 0) {
    last_highlighted_peak = current.peak;
    if (last_highlighted_peak >= n_peaks)
	last_highlighted_peak -= n_peaks;
    $('peak_li_' + last_highlighted_peak).setAttribute('selected', 'true');
  }
}


function show_viewer() {
  infowindow.setContent("<b>Viewer</b><br>7&nbsp;ft above ground<br>(7&nbsp;ft above sea level)");
  infowindow.open(map, current.viewer_marker);
}

function peak_info(p) {
    return '<b>' + p.name + '</b><br>bearing ' + pretty_az(p.az, 1) + '<br>' + pretty_miles_or_km(p.range, 1) + ' away<br>';
}

var last_highlighted_map_peak = -1;

function unhighlight_peak_marker() {
  if (last_highlighted_map_peak != -1) {
    peaks[last_highlighted_map_peak].marker.setIcon('small-red-triangle.png');
    last_highlighted_map_peak = -1;
  }
}

function highlight_peak_marker() {
  if (current.peak == last_highlighted_map_peak)
    return;
  unhighlight_peak_marker();
  if (current.peak >= 0) {
    last_highlighted_map_peak = current.peak % n_peaks;
    peaks[last_highlighted_map_peak].marker.setIcon('hollow-red-triangle.png');
  }
}

function select_map_peak(p) {
  goto_peak(p.index);
  if (current.want_profile) {
    current.want_profile = 0;
    show_profile(p.lat, p.lon);
    return;
  }
  infowindow.setContent(peak_info(p));
   // + '<br><div style="text-align: right; width: 100%"><a href="#" onclick="show_streetview(new $m.LatLng' + p.latlng.toString() + ')">StreetView</a><div>'
  infowindow.open(map, p.marker);
}


var mode_divs = [ 'pan_div', 'list_div', 'map_div', 'details_div', 'profile_div' ];

function div_on(d) {
    mode_divs._foreach(function(s) { $(s).style.display = 'none'; });
    $(d).style.display = 'block';
}


	// ASSUMES p is not in the second copy of peaks (i.e. p < n_peaks)
function goto_peak(p) {
    if (p == -1 || n_peaks == 0)
	return;
    if (current.zoom != 0)
	set_slice(Math.floor(peaks[p].az - current.slice_width/2));
		// did we wrap?
    if (current.slice > peaks[p].az)
        p += n_peaks;
    set_peak(p);
}

	// this will be useful once we can drag the panorama
//function move_offset(offset, x) {
//    set_slice(offset / m_pixels_per_az_degree);
//    move_to_peak(x);
//}
//
//  HACK: mode is number of parts - 1, e.g. 0 for DD, 1 for 'DDMM', 2 for 'DDMMSS'
//function format_angle(x, mode, pos_char, neg_char, is_html) {
//  var a = expand_angle(Math.abs(x), mode);
//  var s = '';
//  var symbols = [is_html? '&deg;' : '', "'", '"'];
//  var space = is_html? '&nbsp;' : ' ';
//  for (var i = 0; i <= mode; i++)
//    s += (i == 0? '' : space) + a[i] + symbols[i];
//  if (x < 0)
//    if (neg_char)
//      s += space + neg_char;
//    else
//      s = '-' + s;
//  else if (pos_char)
//   s += space + pos_char;
//
//  return s;
//}
//
//function expand_angle(x, mode) {
//  if (mode == 0)
//    return [round6(x)];
//  var d = Math.floor(x);
//  x = 60 * (x - d);
//  if (mode == 1)
//    return [d, round4(x)];
//  var m = Math.floor(x);
//  x = 60 * (x - m);
//  return [d, m, round2(x)];
//}
//
//function pretty_lat(x, mode, is_html) {
//    return format_angle(x, mode, 'N', 'S', is_html);
//}
//
//function pretty_lon(x, mode, is_html) {
//    return format_angle(x, mode, 'E', 'W', is_html);
//}
//
//function pretty_latlon(lat, lon, mode, is_html) {
//  return    format_lat(lat, mode, is_html)
//          + (is_html? '&nbsp;&nbsp;' : '  ')
//          + format_lon(lon, mode, is_html);
//}

function pretty_az(x, is_html) {
  if (x >= 360) x -= 360;
  return round0(x) + (is_html? '&deg;' : '');
}

var METERS_PER_FOOT = .3048;
var METERS_PER_MILE = 1609.344;

function pretty_feet_or_meters(x, is_html) {
  return current.use_metric? round0(x) + 'm' : round0(x / METERS_PER_FOOT) + (is_html? '&nbsp;' : ' ') + 'ft';
}

function pretty_miles_or_km(x, is_html) {
  return current.use_metric? round0(x/1000)            + (is_html? '&nbsp;' : ' ') + 'km'
			   : round0(x/METERS_PER_MILE) + (is_html? '&nbsp;' : ' ') + (round0(x/METERS_PER_MILE) == 1? 'mile' : 'miles');
}

function read_cookie(c) {
  var s = document.cookie.match(new RegExp(c + '=([^;]*)'));
  return s && s[1]? s[1] : null;  
}

//function set_cookie(c, v) {
//  document.cookie = c + '=' + v + ';expires=' + new Date((new Date()).getTime() + 365 * 24 * 60 * 60 * 100).toGMTString();
//}


function set_units(use_metric) {
  current.use_metric = use_metric;
//radio_set(document.f_settings.units, current.use_metric);
//set_cookie('units', current.use_metric);
//redraw_for_format_change();
}

function set_degrees_format(degrees_format) {
  current.degrees_format = degrees_format % 3;
//radio_set(document.f_settings.degrees_format, current.degrees_format);
//set_cookie('df', current.degrees_format);
//redraw_for_format_change();
}

function round0(x) {
  return Math.round(x);
}

function round1(x) {
  return Math.round(x * 10)/10;
}

function round2(x) {
  return Math.round(x * 100)/100;
}

function round4(x) {
  return Math.round(x * 10000)/10000;
}

function round6(x) {
  return Math.round(x * 1000000)/1000000;
}

function preload_images(a) {
    a._foreach(function(s) { (new Image()).src = s; });
}


var cloak_overlays = [new $m.GroundOverlay('/results/JFT8X46T/cloakmN39E016.png', new $m.LatLngBounds(new $m.LatLng(39, 016), new $m.LatLng(40, 17))),
new $m.GroundOverlay('/results/JFT8X46T/cloakmN40E015.png', new $m.LatLngBounds(new $m.LatLng(40, 015), new $m.LatLng(41, 16))),
new $m.GroundOverlay('/results/JFT8X46T/cloakmN40E016.png', new $m.LatLngBounds(new $m.LatLng(40, 016), new $m.LatLng(41, 17))),
new $m.GroundOverlay('/results/JFT8X46T/cloakmN40E017.png', new $m.LatLngBounds(new $m.LatLng(40, 017), new $m.LatLng(41, 18)))];
var cloak_is_shown = 0;

function toggle_cloak() {
  if (cloak_is_shown)
    hide_cloak();
  else
   show_cloak();
}

function show_cloak() {
  cloak_overlays._foreach(function(c) { c.setMap(map) });
  cloak_is_shown = 1;
}

function hide_cloak() {
  cloak_overlays._foreach(function(c) { c.setMap(null) });
  cloak_is_shown = 0;
}


function show_profile(lat, lon) {
  $('profile_img').src = 'https://profile.heywhatsthat.com/bin/profile-0904.cgi?src=iphone-map&axes=1&greatcircle=1'
		+ '&pt0=40.4675,17.23083,,2,9906ff'
		+ '&pt1=' + lat + ',' + lon + ',,,c60205';
  set_mode('profile');
}

function toggle_contours() {
  if (map.overlayMapTypes.getLength() > 0 && map.overlayMapTypes.getAt(0) == contoursMapType)
    map.overlayMapTypes.removeAt(0, contoursMapType);
  else
    map.overlayMapTypes.insertAt(0, contoursMapType);
}


var profile_explained = 0;
function explain_profile() {
  if (profile_explained)
   return;
  profile_explained = 1;
  alert("Now click on the map or on a peak and you'll see the elevation profile to that spot");
}


function TControl(text, title, index, position, onclick) {
  this.div = document.createElement('DIV');
  this.div.className = 'tcontrol';
  this.div.index = index;

  var ui = document.createElement('DIV');
  ui.title = title;
  ui.className = 'tcontrol_ui';
  this.div.appendChild(ui);

  var t = document.createElement('DIV');
  t.innerHTML = text;
  t.className = 'tcontrol_text';
  ui.appendChild(t);

  control = this;
  google.maps.event.addDomListener(ui, 'click', onclick);
  map.controls[position].push(this.div);
}

