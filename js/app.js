var current = {
    az_advance_per_click: 45,
    degrees_format: 0,
    df: 0,
    left_edge: 0,
    mode: "in",
    peak: -1,
    pixels_per_az_degree: 2.2222222222222223,
    slice: 0,
    slice_first_peak: -1,
    slice_last_peak: -1,
    slice_width: 144,
    swing: 0,
    units: 0,
    use_metric: 0,
    want_profile: 0,
    zoom: 1
  };

  var result = {
    id: null,
    name: '',
    status: '',
  
    viewer_lat: 0,
    viewer_lon: 0,
    viewer_latlng: null,
  
    elev: 0,
    elev_agl: 0,
    ground_amsl: 0,
    is_public: false,
    declination: 0,
    queued_time: 0,
    start_time: 0,
    end_time: 0
  };

  function show_result(id, _print_layout, callback) {
    if (id == result.id) {
      show_current_result(_print_layout);
      return;
    }
  
    hwt.view_info(id, function(s) {
      if (!s) {
        alert('unknown panorama ' + id);
        callback(0);
        return;
      }
  
      result = s
      console.log(result)
  
      if (result.refraction == null)
        result.refraction = .14;
  
              // STATUS
      if (result.status != 'ok') {
        if (!dont_warn)
          alert(result.name + (result.status == 'error'? ' failed (missing data)' : ' not ready'));
        callback(0);
        return;
      }
  
      result.peaks
      peaks._foreach(function(p) {
        p.az_mag = p.az - result.declination;
        if (p.az_mag  < 0) p.az_mag += 360;
        p.az_true = p.az;
        if (p.az_true < 0) p.az_true += 360;
      });
  
      //limits = result.limits;
      if (callback)
        callback(1);
    });
  }

  function set_slice(az) {
    az %= 360;
    if (az < 0) az += 360;
    current.slice = az;
    current.left_edge  = current.slice * current.pixels_per_az_degree;

    var imgl = document.querySelector("#img_in_left");
	var imgr = document.querySelector("#img_in_right");
    if (current.zoom == 1) {
	
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

}

function go_right() {
	set_slice(current.slice + current.az_advance_per_click);
}

function go_left() {
	set_slice(current.slice - current.az_advance_per_click);
}

/////////////////////////////////
////shortpress / longpress logic
////////////////////////////////

let longpress = false;
	const longpress_timespan = 1000;
	let timeout;

function longpress_action(param) {
    console.log(param)
    switch(param.key) {
        default:
        break;
    }
}

function shortpress_action(param) {
    console.log(param)
    switch(param.key) {
        case "ArrowLeft":
            go_left()
        break;
        case "ArrowRight":
            go_right()
        break;
        default:
        break;
    }
}

function repeat_action(param) {
    console.log(param)
    switch(param.key) {
        case "ArrowLeft":
            go_left()
        break;
        case "ArrowRight":
            go_right()
        break;
        default:
        break;
    }
}


function handleKeyDown(evt) {

    if (evt.key == "EndCall") evt.preventDefault();
    if (evt.key === 'MicrophoneToggle') evt.preventDefault();
    if (!evt.repeat) {
        longpress = false;
        timeout = setTimeout(() => {
            longpress = true;
            longpress_action(evt);
        }, longpress_timespan);
    }

    if (evt.repeat) {
        longpress = false;
        repeat_action(evt);
    }
}

function handleKeyUp(evt) {
    if (evt.key == "Backspace") evt.preventDefault(); // Disable close app by holding backspace
    if (evt.key == "EndCall") evt.preventDefault();
    clearTimeout(timeout);
    if (!longpress) {
        shortpress_action(evt);
    }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);