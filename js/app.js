function $(id) {
    return document.getElementById(id);
}

function $$(id) {
    return document.getElementById(id).style;
}
Array.prototype._foreach = function (f, i) {
    for (var __i = 0; __i < this.length; __i++) f(this[__i], __i);
};

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
    slice_width: window.screen.width * 360 / 800, // 240
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
        //show_current_result(_print_layout);
        return;
    }

    hwt.view_info(id, function (s) {
        if (!s) {
            alert('unknown panorama ' + id);
            callback(0);
            return;
        }

        result = s
        console.log(result)

        localStorage.setItem("last_view", id)

        if (result.refraction == null)
            result.refraction = .14;

        // STATUS
        if (result.status != 'ok') {
            if (!dont_warn)
                alert(result.name + (result.status == 'error' ? ' failed (missing data)' : ' not ready'));
            callback(0);
            return;
        }


        result.peaks._foreach(function (p) {
            p.az_mag = p.az - result.declination;
            if (p.az_mag < 0) p.az_mag += 360;
            p.az_true = p.az;
            if (p.az_true < 0) p.az_true += 360;
        });

        result.peaks.sort((a, b) => a.az_mag - b.az_mag);

        var newp = []

        for (let i = 0; i < (result.peaks.length * 2); i++) {
            var newobj = JSON.parse(JSON.stringify(result.peaks[i % result.peaks.length]))
            if (i >= result.peaks.length) {
                console.log(i)
                newobj.az += 360
                newobj.az_true += 360
                newobj.az_mag += 360
            }
            newp.push(newobj)
        }

        result.peaks = newp

        /*result.peaks._foreach(function (p, i) {
            if (i > (result.peaks.length / 2)) {
                console.log(i, p.name)
                
            } else {
                console.log(i, p.az_mag)
                if ((p.az_mag - 360) > 0) { // If az is higher than 360, and it's detractable, remove 360 when it isn't a duplicate
                    p.az_mag -= 360
                    console.log(i, p.name)
                }
            }
        });*/


        $("viewname").innerText = result.name

        $("img_in_left").src = "https://www.heywhatsthat.com/results/" + result.id + "/image_j.png"
        $("img_out_left").src = "https://www.heywhatsthat.com/results/" + result.id + "/image_j.png"
        $("img_in_right").src = "https://www.heywhatsthat.com/results/" + result.id + "/image_j.png"
        $("img_out_right").src = "https://www.heywhatsthat.com/results/" + result.id + "/image_j.png"

        //limits = result.limits;
        if (callback)
            callback(1);
    });
}

function set_slice(az) {
    az %= 360;
    if (az < 0) az += 360;
    current.slice = az;
    current.left_edge = current.slice * current.pixels_per_az_degree;

    var imgl = $("img_in_left");
    var imgr = $("img_in_right");
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

    var last_az = current.slice + current.slice_width;
    var p;
    var peaks = result.peaks
    for (p = 0; p < peaks.length && peaks[p].az_mag < current.slice; p++);
    console.log(p)
    if (p == peaks.length || peaks[p].az_mag >= last_az) {
        console.log(p + "-")
        current.slice_first_peak = -1;
        current.slice_last_peak = -1;
    } else {
        console.log(p + "+")
        current.slice_first_peak = p;
        for (; p < peaks.length && peaks[p].az_mag < last_az; p++);
        current.slice_last_peak = p - 1;
        console.log(p - 1 + "++")

    }

}

/*var last_highlighted_peak = -1;

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
    if (last_highlighted_peak >= result.peaks.length)
	last_highlighted_peak -= result.peaks.length;
    $('peak_li_' + last_highlighted_peak).setAttribute('selected', 'true');
  }
}*/

function unset_mark() {
    $('silmarker').style.display = 'none';
}

function set_mark(x) {
    var s = $('silmarker').style;
    s.left = x * current.pixels_per_az_degree - current.left_edge;
    s.display = 'block';
}

function clear_peak_text() {
    $("peak_name").innerText = ""
    $("peak_subtext").innerText = ""
}

function pretty_az(x, is_html) {
    if (x >= 360) x -= 360;
    return Math.round(x) + "&#176;";
}

function set_peak_text(p) {
    $("peak_name").innerHTML = pretty_az(p.az_mag, 1) + " " + p.name
    $("peak_subtext").innerText = Math.round(p.range) + 'km ' + (p.elev ? Math.round(p.elev) + 'm' : '')
}

function set_peak_text_az_only(az) {
    $("peak_subtext").innerText = "Bearing " + pretty_az(p.az_mag, 1)
}

function set_peak_text_no_peaks() {
    $("peak_name").innerText = "No peaks found"
    $("peak_subtext").innerText = ""
}


function set_peak(p) {
    if (result.peaks.length == 0) {
        current.peak = -1;
        return;
    }
    if (p == -1 || p < current.slice_first_peak || p > current.slice_last_peak) {
        current.peak = -1;
        clear_peak_text();
        unset_mark();
        //unhighlight_peak_row();
    } else {
        current.peak = p;
        var pp = result.peaks[p];
        set_peak_text(pp);
        set_mark(pp.az_mag);
        //highlight_peak_row();
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
    for (; p < lastp && result.peaks[p].az_mag < az; p++);
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
    for (; p > firstp && result.peaks[p].az_mag >= az; p--);
    return p;
}

function nearest_center() {
    return nearest_to_az(current.slice + current.slice_width / 2);
}

function nearest_to_az(az) {
    var p = current.slice_first_peak;
    if (p == -1)
        return -1;
    if (result.peaks[p].az_mag >= az)
        return p;
    var lastp = current.slice_last_peak;
    if (result.peaks[lastp].az_mag <= az)
        return lastp;
    for (; p < lastp && result.peaks[p].az_mag < az; p++);
    // is previous peak closer?
    if (az - result.peaks[p - 1].az_mag < result.peaks[p].az_mag - az)
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

function goto_peak(p) {
    if (p == -1 || result.peaks.length == 0)
	return;
    if (current.zoom != 0)
	set_slice(Math.floor(result.peaks[p].az - current.slice_width/2));
		// did we wrap?
    if (current.slice > result.peaks[p].az)
        p += (result.peaks.length / 2);
    set_peak(p);
}

function scroll_right() {
    set_slice(current.slice + current.az_advance_per_click);
    set_peak(nearest_center());
}

function scroll_left() {
    set_slice(current.slice - current.az_advance_per_click);
    set_peak(nearest_center());
}

/////////////////////////////////
////shortpress / longpress logic
////////////////////////////////

function isHidden(el) {
    return (el.offsetParent === null)
}

let tabIndex = 0;

function setTab() {
    //set tabindex
    let t = -1;
    let items = document.querySelectorAll(".item");
    let items_list = [];
    for (let i = 0; i < items.length; i++) {
        if (!isHidden(items[i])) { //(items[i].parentNode.style.display =! "none") {
            items_list.push(items[i]);
            items_list[0].focus();
            t++;
            items_list[items_list.length - 1].setAttribute("tabIndex", t);
        }
    }
    //items_list[0].focus();

    //	document.querySelector("div#finder").style.display = "block";


}



function nav(move) {
    //get items from current pannel
    let items = document.querySelectorAll(".item");
    let items_list = [];
    for (let i = 0; i < items.length; i++) {
        //if (items[i].style.display == "none") continue;
        //if (items[i].parentNode.style.display == "none") continue;
        if (isHidden(items[i])) continue;
        items_list.push(items[i]);
    }



    if (move == "+1") {
        if (tabIndex < items_list.length - 1) {
            tabIndex++;
            items_list[tabIndex].focus();
        } else {
            tabIndex = 0;
            items_list[tabIndex].focus();
        }
    }

    if (move == "-1") {
        if (tabIndex > 0) {
            tabIndex--;
            items_list[tabIndex].focus();
        } else {
            tabIndex = items_list.length - 1
            items_list[tabIndex].focus();

        }
    }

    const rect = document.activeElement.getBoundingClientRect();
    const elY =
        rect.top - document.body.getBoundingClientRect().top + rect.height / 2;

    document.activeElement.parentNode.scrollBy({
        left: 0,
        top: elY - window.innerHeight / 2,
        behavior: "smooth",
    });

    /* const rect = document.activeElement.getBoundingClientRect();
     const elY =
     rect.top - document.body.getBoundingClientRect().top + rect.height / 2;

     document.activeElement.parentNode.scrollBy({
       left: 0,
       top: elY - window.innerHeight / 2,
       behavior: "smooth",
     }); */ // I can't get this to work, please someone open a PR if you somehow get this working, thanks! ;)

}


let longpress = false;
const longpress_timespan = 1000;
let timeout;

function longpress_action(param) {
    switch (param.key) {
        case "ArrowLeft":
            scroll_left()
            break;
        case "ArrowRight":
            scroll_right()
            break;
        case "0":
            show_result(String.toUpperCase(prompt("Enter heywhatsthat.com Panorama ID")), false)
            break;
        default:
            break;
    }
}

function shortpress_action(param) {
    switch (param.key) {
        case "ArrowLeft":
            go_left()
            break;
        case "ArrowRight":
            go_right()
            break;
        case "ArrowUp":
            nav("-1")
            break;
        case "ArrowDown":
            nav("+1")
            break;
        case "SoftRight":
            $("menu").style.display = "block";
            $("LSK").innerText = ""; $("CSK").innerText = "SELECT"; $("RSK").innerText = ""; 
            setTab()

            break;
        case "Enter":
           
            if (document.activeElement.getAttribute("data-peak")) {
                    //set_slice(document.activeElement.getAttribute("data-peak"));
                    goto_peak(Number(document.activeElement.getAttribute("data-peak")));

                    $("menu").style.display = "none"
                    $("about_page").style.display = "none";
                    $("peak_list").style.display = "none";
                    $("menu_page").style.display = "flex";

                    $("LSK").innerText = ""; $("CSK").innerText = ""; $("RSK").innerText = "Menu"; 

                    setTab()

            }
            switch (document.activeElement.getAttribute("data-map")) {
                case "about":
                    $("menu_page").style.display = "none";
                    $("about_page").style.display = "flex";
                    $("LSK").innerText = ""; $("CSK").innerText = ""; $("RSK").innerText = ""; 
                    setTab()
                    break;
                case "peaks":

                    $("menu_page").style.display = "none";
                    $("about_page").style.display = "none";

                    $("peak-list").innerHTML = '';

                    for (let i = 0; i < (result.peaks.length / 2); i++) {
                        var obj = result.peaks[i]

                        $("peak-list").innerHTML += `<div class="item list-item focusable" tabindex="0" data-peak="${i}"><p class="list-item__text">${pretty_az(obj.az_mag, 1) + " " + obj.name}</p><p class="list-item__subtext">${Math.round(obj.range) + 'km ' + (obj.elev ? Math.round(obj.elev) + 'm' : '')}</p></div>`;

                    }

                    $("peak_list").style.display = "flex";
                    setTab()
                    $("LSK").innerText = ""; $("CSK").innerText = "SELECT"; $("RSK").innerText = ""; 

                    break;
                case "download":
                    new MozActivity({
                        name: "view",
                        data: {
                            type: "url", // Possibly text/html in future versions
                            url: "https://www.heywhatsthat.com/results/" + result.id + "/image_j.png"
                        }
                    });
                    /*fetch("https://www.heywhatsthat.com/results/" + result.id + "/image_j.png", {
                        method: 'GET',
                        headers: {
                          'Access-Control-Allow-Origin': '*'
                        }})
                    .then(function(response) {
                      return response.blob()
                    })
                    .then(function(blob) {
                        let link = document.createElement('a');
                            link.download = "hwt_" + result.id + ".png";
                            link.href = URL.createObjectURL(blob);
                            link.dispatchEvent(
                                new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                })
                            );
                            setTimeout(5000, () => {
                                URL.revokeObjectURL(link.href);
                            });
                    });
*/
                    /*"hwt_" + result.id + ".png"
                    var img = new Image;
                    var c = document.createElement("canvas");
                    var ctx = c.getContext("2d");

                    img.onload = function () {
                        c.width = this.naturalWidth; // update canvas size to match image
                        c.height = this.naturalHeight;
                        ctx.drawImage(this, 0, 0); // draw in image
                        c.toBlob(function (blob) { // get content as JPEG blob
                            let link = document.createElement('a');
                            link.download = "hwt_" + result.id + ".png";
                            link.href = URL.createObjectURL(blob);
                            link.dispatchEvent(
                                new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                })
                            );
                            setTimeout(5000, () => {
                                URL.revokeObjectURL(link.href);
                            });
                        }, "image/jpeg", 0.75);
                    };
                    img.crossOrigin = ""; // if from different origin
                    img.src = "https://www.heywhatsthat.com/results/" + result.id + "/image_j.png";*/

                    break;
            }

            break;
        case "Backspace":
            if ($("menu").style.display == "block" && $("menu_page").style.display != "none") {

                $("menu").style.display = "none"
                $("LSK").innerText = ""; $("CSK").innerText = ""; $("RSK").innerText = "Menu"; 

            };

            if ($("menu").style.display == "block" && ($("about_page").style.display != "none" || $("peak_list").style.display != "none")) {
                $("menu_page").style.display = "flex";
                $("about_page").style.display = "none";
                $("peak_list").style.display = "none";
                $("LSK").innerText = ""; $("CSK").innerText = "SELECT"; $("RSK").innerText = ""; 

                setTab()
            };


            break;
        default:
            break;
    }
}

function repeat_action(param) {
    switch (param.key) {
        case "ArrowLeft":
            scroll_left()
            break;
        case "ArrowRight":
            scroll_right()
            break;
        default:
            break;
    }
}


function handleKeyDown(evt) {

    //if (evt.key == "EndCall") evt.preventDefault();
    if (evt.key === 'MicrophoneToggle') evt.preventDefault();
    if (evt.key == "Backspace") evt.preventDefault(); // Disable close app by holding backspace
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

show_result(localStorage.getItem("last_view") || "LIGBSG5C", false) // OSGB Station Panorama Demo

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);