const $ = str => document.querySelector(str);
const $$ = str => document.querySelectorAll(str);
const $isDOM = el => el instanceof Element;

(function() {
if (!window.app) {
    window.app = {};
}
app.carousel = {
    updateClass: function(el, classname='') {
        if (el) {
            el.className = classname;
            return el;
        }
        return;
    },
    reorder: function() {
        let childcnt = $("#carousel").children.length;
        let childs = $("#carousel").children;

        for (let j=0; j< childcnt; j++) {
            childs[j].dataset.pos = j;
        }
    },
    move: function(el) {
        let selected = el;

        if (typeof el === "string") {
            selected = (el == "next") ? $(".selected").nextElementSibling : $(".selected").previousElementSibling;
        } 
        
        if (app.carousel.state.sleeve) {
            app.carousel.closeSleeve();    
        }

        let curpos = parseInt(app.selected.dataset.pos);
        let tgtpos = parseInt(selected.dataset.pos);
        
        let cnt = curpos - tgtpos;
        let dir = (cnt < 0) ? -1 : 1;
        let shift = Math.abs(cnt);
        
        for (let i=0; i<shift; i++) {
            let el = (dir == -1) ? $("#carousel").firstElementChild : $("#carousel").lastElementChild;
            
            if (dir == -1) {
                el.dataset.pos = $("#carousel").children.length; 
                $('#carousel').append(el);
            } else {
                el.dataset.pos = 0;
                $('#carousel').prepend(el);
            }

            app.carousel.reorder();
        }
        

        app.selected = selected;
        let next = selected.nextElementSibling;// ? selected.nextElementSibling : selected.parentElement.firstElementChild;
        let prev = selected.previousElementSibling; // ? selected.previousElementSibling : selected.parentElement.lastElementChild;
        
        let prevSecond = prev ? prev.previousElementSibling : selected.parentElement.lastElementChild;
        let nextSecond = next ? next.nextElementSibling : selected.parentElement.firstElementChild;

        let prevThird = prevSecond ? prevSecond.previousElementSibling : selected.parentElement.lastElementChild;
        let nextThird = nextSecond ? nextSecond.nextElementSibling : selected.parentElement.firstElementChild;

        let prevForth = prevThird ? prevThird.previousElementSibling : selected.parentElement.lastElementChild;
        let nextForth = nextThird ? nextThird.nextElementSibling : selected.parentElement.firstElementChild;

        selected.className = 'album selected';

        app.carousel.updateClass(prev, "album prev-1");
        app.carousel.updateClass(next, "album next-1");

        app.carousel.updateClass(prevSecond, "album prev-2");
        app.carousel.updateClass(nextSecond, "album next-2");

        app.carousel.updateClass(prevThird, "album prev-3");
        app.carousel.updateClass(nextThird, "album next-3");
        
        app.carousel.updateClass(prevForth, "album prev-4");
        app.carousel.updateClass(nextForth, "album next-4");
        
        app.carousel.nextAll(nextForth).forEach(item=>{ item.className = 'album'; item.classList.add('hideRight') });
        app.carousel.prevAll(prevForth).forEach(item=>{ item.className = 'album'; item.classList.add('hideLeft') });

    },
    nextAll: function(el) {
        let els = [];
        
        if (el) {
            while (el = el.nextElementSibling) { els.push(el); }
        }

        return els;
            
    },
    prevAll: function(el) {
        let els = [];
        
        if (el) {
            while (el = el.previousElementSibling) { els.push(el); }
        }


        return els;
    },
    keypress: function(e) {
        switch (e.which) {
            case 37: // left
                app.carousel.move('prev');
                break;

            case 39: // right
                app.carousel.move('next');
                break;
           
            case 27: // escape
            case 13: // enter
                app.carousel.toggleSleeve();
                return false;
            default:
                return;
        }
        e.stopPropagation();
        e.preventDefault();
        return false; 
    },
    select: function(e) {
        
        let tgt = e;

        if (!$isDOM(tgt)) {
            tgt = e.target 
        }
        while (!tgt.parentElement.classList.contains('carousel')) {
            tgt = tgt.parentElement;
        }
        
        app.carousel.move(tgt);

    },
    previous: function(e) {
        app.carousel.move('prev');
    },
    next: function(e) {
        app.carousel.move('next');
    },
    doDown: function(e) {
        app.carousel.state.downX = e.x;
        app.carousel.state.dragging = 1;
    },
    doUp: function(e) {
        let direction = 0, 
            velocity = 0,
            tgt = e.target;
        if (e.target.classList.contains('tab')) {
            return false;
        }
        if (app.carousel.state.downX) {
            direction = (app.carousel.state.downX > e.x) ? -1 : 1;
            velocity = app.carousel.state.downX - e.x;
            
            while (!tgt.parentElement.classList.contains('carousel')) {
                tgt = tgt.parentElement;
            }
            if (tgt.classList.contains('selected')) {
                app.carousel.toggleSleeve();
                return false;
            }

            if (Math.abs(app.carousel.state.downX - e.x) < 10) {
                app.carousel.select(e);
                return false;
            }
            if (direction === -1) {
                app.carousel.move('next');
            } else {
                app.carousel.move('prev');
            }
            app.carousel.state.downX = 0;
        }
        app.carousel.state.dragging = 0;
    },
    doMove: function(e) {
        let dist = app.carousel.state.downX - e.x
    },
    closeSleeve: function() {
        let sel = $(".selected");
        let sleeve = sel.querySelector(".sleeve");

        app.carousel.state.sleeve = 0;
        sel.classList.remove("open");
        sleeve.style.marginLeft = "0vw";
    },
    toggleSleeve: function() {
        let sel = $(".selected");
        let sleeve = sel.querySelector(".sleeve");
        
        app.carousel.state.sleeve ^= 1;
        //setTimeout(function() { $(".selected").classList.toggle("open"); }, 1000);
        sel.classList.toggle("open");
        sel.querySelector(".sleeve").style.marginLeft = (app.carousel.state.sleeve) ? "22vw" : "0vw";
        app.carousel.albumInfo(sel.querySelector(".artist").innerHTML, sel.querySelector(".albumName").innerHTML);
    },
    albumUpdate: function(artist, album, idx) {
        const card = $(`#album-${idx}`);
        if (card) {

            app.carousel.albumGet(artist, album).then(data=> {
                let cover = card.querySelector("img");
                let url = data.album.image[data.album.image.length-1]['#text'];
                
                if (!url) {
                    url = "img/unknown.jpg";
                    cover.style.background = "#999";
                }
                if (cover) {
                    console.log( url);
                    cover.src = url;
                }
                
            });
        }
    },
    albumGet: function(artist, album) {
        if (app.carousel.data.albums[artist+album]) {
            Promise.resolve({album: app.carousel.data.albums[artist+album]});
        } else {
            return fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=8ab04dc41aad7d43deffb0e2ba49b690&artist=${artist}&album=${album}&format=json`).then(r=>r.json());
        }
    },
    albumInfo: function(artist, album) {
        console.log(`looking up for artist: ${artist} album: ${album}`);
        fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=8ab04dc41aad7d43deffb0e2ba49b690&artist=${artist}&album=${album}&format=json`).then(r=>r.json()).then(data=>{
            let out = `<div class='tabbar'><a class='tab trackstab' href='#${album}' onclick='return app.carousel.showTracks(event)'>Tracks</a><a class='tab infotab' href='#${album}_info' onclick='return app.carousel.showInfo(event)'>Info</a><a class='tab similartab' href='#${artist}_similar' onclick='return app.carousel.showSimilar(event)'>Similar</a></div><div class='infohead'><h1>${artist}</h1><h2>${album}</h2></div><div class='liner'><ol class='tracks'>`;
console.dir(data);
            app.carousel.data.albums[album+artist] = data.album;
            
            if (data.album.tracks.track && data.album.tracks.track.length) {
                data.album.tracks.track.forEach((item, idx) => {
                console.dir(item);
                    out += `<li>${item.name} <span class='track-length'>[${app.carousel.formatTime(item.duration)}]</span></li>`;
                });
            }
            out += "</ol></div>";
            out += "<div class='info'>";
            if (data.album.wiki && data.album.wiki.content) {
                let content = data.album.wiki.content;
                content = content.replace(/\n/g, '<br>').replace(/<a.+?Read\smore.*/, '');
                
                out += `<div class='wiki'>${content}</div>`;
            }

            if (data.album.playcount) {
                out += `<div class='playcount'>Playcount: ${app.carousel.makeHuman(data.album.playcount)}</div>`;
                out += `<div class='playcount'>Listeners: ${app.carousel.makeHuman(data.album.listeners)}</div>`;
            }
            out += `<div class='debug'>MBID: ${data.album.mbid}</div>`;
            out += '</div>';
            out += "<div class='similar'></div>";

            console.dir(out);        
            app.carousel.data.albums[album+artist].ui = out;

            $(".selected").classList.add('tabtracks');
            $(".selected").classList.remove('tabinfo');
            $(".selected").classList.remove('tabsimilar');
            $(".selected").querySelector(".sleeve").innerHTML = out;
            app.carousel.similarArtists(artist);
        });
    },
    similarArtists: function(artist) {
        fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${artist}&api_key=8ab04dc41aad7d43deffb0e2ba49b690&format=json`).then(res=>res.json())
            .then(data=>{
                let list = data.similarartists.artist;
                let out = "";
                list.forEach((item, idx)=>{
                    if (idx < 15) {
                        out += `<div class='card'><a href='#'><img src='/art.php?q=${item.name}' height='100' width='100'><div>${item.name}</div></a></div>`;
                    }
                });

                $(".selected .similar").innerHTML = out;
            });
    },
    addAlbum: function(artist, album) {
        
    },
    makeHuman: function(num) {
        let out = '',
            letter = '';
        if (num > 1000000) {
            num = num / 1000000;
            letter = "M";
        } else if (num > 1000) {
            num = num / 1000;
            letter = "K";
        }
        num = Math.floor(num * 10) / 10;
        return num + letter;
    },
    formatTime: function(seconds) {
        let formatted, min, sec;

        if (seconds) {
            min = Math.floor(seconds / 60);
            sec = seconds - (min * 60);
            if (sec < 10) {
                sec = "0" + sec;
            }
            formatted = min + ':' + sec;
        } else {
            formatted = '0:00';
        }
        return formatted;
    },
    showTracks: function(e) {
        console.log("showTracks");
        console.dir(e);
        let par, el = e.target;

        while (!par) {
            if (el.className.match(/album/)) {
               par = el;
            }
            el = el.parentElement;
        }
        par.classList.add('tabtracks');
        par.classList.remove('tabinfo');
        par.classList.remove('tabsimilar');

        e.stopPropagation();
        e.preventDefault();
        return false;
    },
    showInfo: function(e) {
        console.log("showInfo");
        console.dir(e);
        let par, el = e.target;

        while (!par) {
            if (el.className.match(/album/)) {
               par = el;
            }
            el = el.parentElement;
        }
        par.classList.remove('tabtracks');
        par.classList.remove('tabsimilar');
        par.classList.add('tabinfo');

        e.stopPropagation();
        e.preventDefault();
        return false;
    },
    showSimilar: function(e) {
        console.log("showSimilar");
        console.dir(e);
        let par, el = e.target;

        while (!par) {
            if (el.className.match(/album/)) {
               par = el;
            }
            el = el.parentElement;
        }
        par.classList.remove('tabtracks');
        par.classList.remove('tabinfo');
        par.classList.add('tabsimilar');

        e.stopPropagation();
        e.preventDefault();
        return false;
    },
    fetchData: function(url, cb) {
        fetch(url).then(
            response=>response.json()
        ).then(data=>{
            let result = cb(data);
            console.dir(result);
        });
    },
    makeItem: function(data, cls, id='') {
        let did = id ? `id="${id}" ` : '';
        cls = cls ? cls : 'hideRight';
        return `<div ${did} class="album ${cls}"><img alt="${data.name}" src="${data.url}"><div class="sleeve"></div><div class="title"><div class="artist">${data.artist}</div><div class="albumName">${data.name}</div></div></div>`;
    },
    getArt: function(album, artist, img) {
        
    },
    fillCarousel: function(data) {
        console.log("fillCarousel");
        let out = "", html = "";
        let keys = ['hideLeft', 'prev-4', 'prev-3', 'prev-2', 'prev-1', 'selected', 'next-1', 'next-2', 'next-3', 'next-4', 'hideRight'];
        let kl = keys.length, key = '';
        data.albums.forEach((item, idx)=>{
            key = (idx > kl) ? 'hideRight' : keys[idx];
            html = app.carousel.makeItem(item, key, `album-${idx}`);
            out += html;
        });
        $("#carousel").innerHTML = out;
        app.carousel.reorder();
    },
    addAlbums: function(data) {
        app.carousel.fillCarousel(data);
        data.albums.forEach((album, idx) => {
            app.carousel.albumUpdate(album.artist, album.name, idx);
        });
        app.selected = $(".selected");
    },
    load: function(url) {
        // console.dir(url);
        app.carousel.fetchData(url, app.carousel.addAlbums);
    },
    scroll: function(e) {
        const now = Date.now();
        if ($(".selected .sleeve").contains(e.target)) {
            console.log("scrolling over sleeve");
            return true;
        };
        e.preventDefault();
        e.stopPropagation();
        // console.dir(e);
        if (now - app.carousel.state.delta.last < 100) {
            return false;
        }

        // Reset delta tracking after no movement for 300ms
        if (( now - app.carousel.state.delta.last) > 300) {
            app.carousel.clearDelta()
        }
        app.carousel.state.delta.x += e.wheelDeltaX;
        app.carousel.state.delta.y += e.wheelDeltaY;
        app.carousel.state.delta.last = Date.now();
        
        if ((e.wheelDeltaX < 0) || (e.wheelDeltaY < 0)) {
            if ((app.carousel.state.delta.x < -750) || (app.carousel.state.delta.y < -500)) {
                app.carousel.clearDelta();
                app.carousel.next();
            }
        } else if ((e.wheelDeltaX > 0) || (e.wheelDeltaY > 0)) {
            if ((app.carousel.state.delta.x > 750) || (app.carousel.state.delta.y > 500)) {
                app.carousel.clearDelta();
                app.carousel.previous();
            }
        }
        return false;
    },
    onScroll: function(x) {
        // console.dir(x);

    },
    clearDelta: function() {
        app.carousel.state.delta.x = 0;
        app.carousel.state.delta.y = 0;
    },
    init: function() {
        window.addEventListener("wheel", app.carousel.scroll, { passive: false });
        document.addEventListener("keydown", app.carousel.keypress);
        $("#carousel").addEventListener("mousedown", app.carousel.doDown);
        $("#carousel").addEventListener("mousemove", app.carousel.doMove);
        $("#carousel").addEventListener("touchstart", app.carousel.doDown, {passive: true});
        $("#carousel").addEventListener("mouseup", app.carousel.doUp);
        $("#carousel").addEventListener("touchend", app.carousel.doup);

        app.carousel.reorder();
        $('#prev').addEventListener("click", app.carousel.previous);
        $('#next').addEventListener("click", app.carousel.next);
        app.carousel.load("sample-albums.json");
        app.selected = $(".selected");

    },
    state: {
        delta: {
            x: 0,
            y: 0,
            last: Date.now()
        },
        sleeve: 0
    },
    data: {
        albums: {},
        artists: {},
        tracks: {}
    }

}
app.carousel.init();
})();

