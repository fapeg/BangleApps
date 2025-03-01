/*
Bluetooth.println(JSON.stringify({t:"intent", action:"", flags:["flag1", "flag2",...], categories:["category1","category2",...], mimetype:"", data:"",  package:"", class:"", target:"", extra:{someKey:"someValueOrString"}}));
*/

var R;
var backToMenu = false;
var isPaused = true;
var dark = g.theme.dark; // bool

// The main layout of the app
function gfx() {
  //Bangle.drawWidgets();
  R = Bangle.appRect;
  marigin = 8;
  // g.drawString(str, x, y, solid)
  g.clearRect(R);
  g.reset();
  
  if (dark) {g.setColor(0x07E0);} else {g.setColor(0x03E0);} // Green on dark theme, DarkGreen on light theme.
  g.setFont("4x6:2");
  g.setFontAlign(1, 0, 0);
  g.drawString("->", R.x2 - marigin, R.y + R.h/2);

  g.setFontAlign(-1, 0, 0);
  g.drawString("<-", R.x + marigin, R.y + R.h/2);

  g.setFontAlign(-1, 0, 1);
  g.drawString("<-", R.x + R.w/2, R.y + marigin);

  g.setFontAlign(1, 0, 1);
  g.drawString("->", R.x + R.w/2, R.y2 - marigin);

  g.setFontAlign(0, 0, 0);
  g.drawString("Play\nPause", R.x + R.w/2, R.y + R.h/2);

  g.setFontAlign(-1, -1, 0);
  g.drawString("Menu", R.x + 2*marigin, R.y + 2*marigin);

  g.setFontAlign(-1, 1, 0);
  g.drawString("Wake", R.x + 2*marigin, R.y + R.h - 2*marigin);

  g.setFontAlign(1, -1, 0);
  g.drawString("Srch", R.x + R.w - 2*marigin, R.y + 2*marigin);

  g.setFontAlign(1, 1, 0);
  g.drawString("Saved", R.x + R.w - 2*marigin, R.y + R.h - 2*marigin);
}

// Touch handler for main layout
function touchHandler(_, xy) {
  x = xy.x;
  y = xy.y;
  len = (R.w<R.h+1)?(R.w/3):(R.h/3);

  // doing a<b+1 seemed faster than a<=b, also using a>b-1 instead of a>b.
  if ((R.x-1<x && x<R.x+len) && (R.y-1<y && y<R.y+len)) {
    //Menu
    Bangle.removeAllListeners("touch");
    Bangle.removeAllListeners("swipe");
    backToMenu = true;
    E.showMenu(spotifyMenu);
  } else if ((R.x-1<x && x<R.x+len) && (R.y2-len<y && y<R.y2+1)) {
    //Wake 
    gadgetbridgeWake();
    gadgetbridgeWake();
  } else if ((R.x2-len<x && x<R.x2+1) && (R.y-1<y && y<R.y+len)) {
    //Srch
    Bangle.removeAllListeners("touch");
    Bangle.removeAllListeners("swipe");
    E.showMenu(searchMenu);
  } else if ((R.x2-len<x && x<R.x2+1) && (R.y2-len<y && y<R.y2+1)) {
    //Saved
    Bangle.removeAllListeners("touch");
    Bangle.removeAllListeners("swipe");
    E.showMenu(savedMenu);
  } else if ((R.x-1<x && x<R.x+len) && (R.y+R.h/2-len/2<y && y<R.y+R.h/2+len/2)) {
    //Previous 
    spotifyWidget("PREVIOUS");
  } else if ((R.x2-len+1<x && x<R.x2+1) && (R.y+R.h/2-len/2<y && y<R.y+R.h/2+len/2)) {
    //Next
    spotifyWidget("NEXT");
  } else if ((R.x-1<x && x<R.x2+1) && (R.y-1<y && y<R.y2+1)){
    //play/pause
    playPause = isPaused?"play":"pause";
    Bangle.musicControl(playPause);
    isPaused = !isPaused;
  }
}

// Swipe handler for main layout, used to jump backward and forward within a podcast episode.
function swipeHandler(LR, _) {
  if (LR==-1) {
    spotifyWidget("NEXT");
  }
  if (LR==1) {
    spotifyWidget("PREVIOUS");
  }
}

// Navigation input on the main layout
function setUI() {
  // Bangle.setUI code from rigrig's smessages app for volume control: https://git.tubul.net/rigrig/BangleApps/src/branch/personal/apps/smessages/app.js
  Bangle.setUI(
    {mode : "updown", back : load}, 
    ud => {
      if (ud) Bangle.musicControl(ud>0 ? "volumedown" : "volumeup");
    }
  );
  Bangle.on("touch", touchHandler);
  Bangle.on("swipe", swipeHandler);
}



// Get back to the main layout
function backToGfx() {
  E.showMenu();
  g.clear();
  g.reset();
  Bangle.removeAllListeners("touch");
  Bangle.removeAllListeners("swipe");
  setUI();
  gfx();
  backToMenu = false;
}

/*
The functions for interacting with Android and the Spotify app
*/

simpleSearch = "";
function simpleSearchTerm() { // input a simple search term without tags, overrides search with tags (artist and track)
  require("textinput").input({text:simpleSearch}).then(result => {simpleSearch = result;}).then(() => {E.showMenu(searchMenu);});
}

artist = "";
function artistSearchTerm() { // input artist to search for
  require("textinput").input({text:artist}).then(result => {artist = result;}).then(() => {E.showMenu(searchMenu);});
}

track = "";
function trackSearchTerm() { // input track to search for
  require("textinput").input({text:track}).then(result => {track = result;}).then(() => {E.showMenu(searchMenu);});
}

album = "";
function albumSearchTerm() { // input album to search for
  require("textinput").input({text:album}).then(result => {album = result;}).then(() => {E.showMenu(searchMenu);});
}

function searchPlayWOTags() {//make a spotify search and play using entered terms
  searchString = simpleSearch;
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.media.action.MEDIA_PLAY_FROM_SEARCH", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", target:"activity", extra:{query:searchString}, flags:["FLAG_ACTIVITY_NEW_TASK"]}));
}

function searchPlayWTags() {//make a spotify search and play using entered terms
  searchString = (artist=="" ? "":("artist:\""+artist+"\"")) + ((artist!="" && track!="") ? " ":"") + (track=="" ? "":("track:\""+track+"\"")) + (((artist!="" && album!="") || (track!="" && album!="")) ? " ":"") + (album=="" ? "":(" album:\""+album+"\""));
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.media.action.MEDIA_PLAY_FROM_SEARCH", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", target:"activity", extra:{query:searchString}, flags:["FLAG_ACTIVITY_NEW_TASK"]}));
}

function playVreden() {//Play the track "Vreden" by Sara Parkman via spotify uri-link
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:track:5QEFFJ5tAeRlVquCUNpAJY:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function playVredenAlternate() {//Play the track "Vreden" by Sara Parkman via spotify uri-link
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:track:5QEFFJ5tAeRlVquCUNpAJY:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK"]}));
}

function searchPlayVreden() {//Play the track "Vreden" by Sara Parkman via search and play
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.media.action.MEDIA_PLAY_FROM_SEARCH", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", target:"activity", extra:{query:'artist:"Sara Parkman" track:"Vreden"'}, flags:["FLAG_ACTIVITY_NEW_TASK"]}));
}

function openAlbum() {//Play EP "The Blue Room" by Coldplay
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:album:3MVb2CWB36x7VwYo5sZmf2", target:"activity", flags:["FLAG_ACTIVITY_NEW_TASK"]}));
}

function searchPlayAlbum() {//Play EP "The Blue Room" by Coldplay via search and play
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.media.action.MEDIA_PLAY_FROM_SEARCH", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", target:"activity", extra:{query:'album:"The blue room" artist:"Coldplay"', "android.intent.extra.focus":"vnd.android.cursor.item/album"}, flags:["FLAG_ACTIVITY_NEW_TASK"]}));
}

function spotifyWidget(action) {
  Bluetooth.println(JSON.stringify({t:"intent", action:("com.spotify.mobile.android.ui.widget."+action), package:"com.spotify.music", target:"broadcastreceiver"}));
}

function gadgetbridgeWake() {
  Bluetooth.println(JSON.stringify({t:"intent", target:"activity", flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_CLEAR_TASK", "FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS", "FLAG_ACTIVITY_NO_ANIMATION"], package:"gadgetbridge", class:"nodomain.freeyourgadget.gadgetbridge.activities.WakeActivity"}));
}

function spotifyPlaylistDW() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZEVXcRfaeEbxXIgb:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function spotifyPlaylistDM1() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZF1E365VyzxE0mxF:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function spotifyPlaylistDM2() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZF1E38LZHLFnrM61:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function spotifyPlaylistDM3() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZF1E36RU87qzgBFP:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function spotifyPlaylistDM4() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZF1E396gGyCXEBFh:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function spotifyPlaylistDM5() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZF1E37a0Tt6CKJLP:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function spotifyPlaylistDM6() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZF1E36UIQLQK79od:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function spotifyPlaylistDD() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZF1EfWFiI7QfIAKq:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

function spotifyPlaylistRR() {
  Bluetooth.println(JSON.stringify({t:"intent", action:"android.intent.action.VIEW", categories:["android.intent.category.DEFAULT"], package:"com.spotify.music", data:"spotify:user:spotify:playlist:37i9dQZEVXbs0XkE2V8sMO:play", target:"activity" , flags:["FLAG_ACTIVITY_NEW_TASK", "FLAG_ACTIVITY_NO_ANIMATION"/*,  "FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_PREVIOUS_IS_TOP"*/]}));
}

// Spotify Remote Menu
var spotifyMenu = {
  "" : { title : " ",
        back: backToGfx },
  "Controls" : ()=>{E.showMenu(controlMenu);},
  "Search and play" : ()=>{E.showMenu(searchMenu);},
  "Saved music" : ()=>{E.showMenu(savedMenu);},
  "Wake the android" : function() {gadgetbridgeWake();gadgetbridgeWake();},
  "Exit Spotify Remote" : ()=>{load();}
};


var controlMenu = {
  "" : { title : " ",
        back: () => {if (backToMenu) E.showMenu(spotifyMenu);
                     if (!backToMenu) backToGfx();} },
  "Play" : ()=>{Bangle.musicControl("play");},
  "Pause" : ()=>{Bangle.musicControl("pause");},
  "Previous" : ()=>{spotifyWidget("PREVIOUS");},
  "Next" : ()=>{spotifyWidget("NEXT");},
  "Play (widget, next then previous)" : ()=>{spotifyWidget("NEXT"); spotifyWidget("PREVIOUS");},
  "Messages Music Controls" : ()=>{load("messagesmusic.app.js");},
};

var searchMenu = {
  "" : { title : " ",
        back: () => {if (backToMenu) E.showMenu(spotifyMenu);
                     if (!backToMenu) backToGfx();} },
  "Search term w/o tags" : ()=>{simpleSearchTerm();},
  "Execute search and play w/o tags" : ()=>{searchPlayWOTags();},
  "Search term w tag \"artist\"" : ()=>{artistSearchTerm();},
  "Search term w tag \"track\"" : ()=>{trackSearchTerm();},
  "Search term w tag \"album\"" : ()=>{albumSearchTerm();},
  "Execute search and play with tags" : ()=>{searchPlayWTags();},
};

var savedMenu = {
  "" : { title : " ",
        back: () => {if (backToMenu) E.showMenu(spotifyMenu);
                     if (!backToMenu) backToGfx();} },
  "Play Discover Weekly" : ()=>{spotifyPlaylistDW();},
  "Play Daily Mix 1" : ()=>{spotifyPlaylistDM1();},
  "Play Daily Mix 2" : ()=>{spotifyPlaylistDM2();},
  "Play Daily Mix 3" : ()=>{spotifyPlaylistDM3();},
  "Play Daily Mix 4" : ()=>{spotifyPlaylistDM4();},
  "Play Daily Mix 5" : ()=>{spotifyPlaylistDM5();},
  "Play Daily Mix 6" : ()=>{spotifyPlaylistDM6();},
  "Play Daily Drive" : ()=>{spotifyPlaylistDD();},
  "Play Release Radar" : ()=>{spotifyPlaylistRR();},
  "Play \"Vreden\" by Sara Parkman via uri-link" : ()=>{playVreden();},
  "Open \"The Blue Room\" EP (no autoplay)" : ()=>{openAlbum();},
  "Play \"The Blue Room\" EP via search&play" : ()=>{searchPlayAlbum();},
};

Bangle.loadWidgets();
setUI();
gfx();
