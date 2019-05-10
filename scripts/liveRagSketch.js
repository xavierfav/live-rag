var currentPitch;
var live = false;

var extraSpaceH = 45;
var extraSpaceW = 0;
var mainSpace = 600;
var margin = 10;
var easing = 0.5;
var backColor;
var backColorTrans;
var frontColor;
var shadeColor;

var ragInfo;
var recordingsList;
var pitchSpace;
var svaraList = [];
var svaraRadius1 = 20;
var svaraRadius2 = 17;
var svaraLine = 70;
var minHz;
var maxHz;
var pitchTrack;
var trackFile;
var track;
var trackDuration;
var ragName;

var ragMenu;
var recordingsMenu;
var buttonPlay;

var cursorTop;
var cursorBottom;
var cursorY = 0;
var navBoxH = 25;
var navCursor;
var navBox;
var navCursorW = 4;
var melCursorX;
var clock;

var talCursor;
var talX;
var talY;
var talRadius;
var talBoxes = [];
var talList = {};
var talCircles = {};
var talName = undefined;
var currentTal = undefined;
var currentAvart;
var strokeRadius1 = 20;
var strokeRadius2 = 15;
var iconDistance = 0.7;

var failedLoading;
var loaded = false;
var paused = true;
var charger;
var currentTime = 0;
var jump;

function preload() {
  ragInfo = loadJSON("files/ragInfo.json");
  recordingsList = loadJSON("files/recordingsList.json");
}

function setup () {
  var canvas = createCanvas(extraSpaceW+mainSpace, extraSpaceH+mainSpace);
  var div = select("#sketch-holder");
  div.style("width: " + width + "px; margin: 10px auto; position: relative;");
  canvas.parent("sketch-holder");

  background(254, 249, 231);

  ellipseMode(RADIUS);
  angleMode(DEGREES);
  imageMode(CENTER);
  textFont("Laila");
  strokeJoin(ROUND);
  strokeCap(ROUND);

  backColor = color(240, 128, 128);
  backColorTrans = color(120, 0, 0, 100);
  frontColor = color(120, 0, 0);
  shadeColor = color(120, 0, 0);

  buttonPlay = createButton("Load")
    .size(80, 25)
    .mouseClicked(player)
    .attribute("hidden", "true")
    .parent("sketch-holder");
  buttonPlay.position(extraSpaceW + margin, height - buttonPlay.height - margin);

  navBox = new CreateNavigationBox();
  navCursor = new CreateNavCursor();

  cursorTop = extraSpaceH + margin*3 + 50;
  cursorBottom = navBox.y1 - margin*2;
  melCursorX = extraSpaceW + (mainSpace / 2);

  ragMenu = createSelect()
    .size(120, 25)
    .position(extraSpaceW + margin, margin)
    .changed(startRag)
    .parent("sketch-holder");
  ragMenu.option("Select a rāg");
  var noRec = ragMenu.child();
  noRec[0].setAttribute("selected", "true");
  noRec[0].setAttribute("disabled", "true");
  noRec[0].setAttribute("hidden", "true");
  noRec[0].setAttribute("style", "display: none");
  ragList = Object.keys(ragInfo);
  for (var i = 0; i < ragList.length; i++) {
    var rag = ragInfo[ragList[i]].name + " " + ragInfo[ragList[i]].nameTrans;
    ragMenu.option(rag, ragList[i]);
  }

  ragMenu = createSelect()
    .size(120, 25)
    .position(extraSpaceW + margin, margin)
    .changed(startRag)
    .parent("sketch-holder");
  ragMenu.option("Select a rāg", "None");
  var ragList = Object.keys(ragInfo);
  for (var i = 0; i < ragList.length; i++) {
    var rag = ragInfo[ragList[i]].name + " " + ragInfo[ragList[i]].nameTrans;
    ragMenu.option(rag, ragList[i]);
  }

  recordingsMenu = createSelect()
    .size(120, 25)
    .changed(start)
    .parent("sketch-holder");
  recordingsMenu.position(width - recordingsMenu.width - margin, margin);
  recordingsMenu.option("Select a recording", "None");
  var recList = Object.keys(recordingsList);
  for (var i = 0; i < recList.length; i++) {
    var rec = recordingsList[recList[i]].selectOption;
    recordingsMenu.option(rec, recList[i]);
  }
}

function draw () {
  fill(backColor);
  noStroke();
  rect(extraSpaceW, extraSpaceH, width, height);

  textAlign(CENTER, TOP);
  textStyle(NORMAL);
  textSize(30);
  strokeWeight(5);
  stroke(frontColor);
  fill(backColor);
  text(ragName, extraSpaceW + mainSpace/2, extraSpaceH + margin*3);

  stroke(0, 50);
  strokeWeight(1);
  line(extraSpaceW + margin*2, extraSpaceH + margin*3 + 30, width - margin*2, extraSpaceH + margin*3 + 30);

  for (var i = 0; i < svaraList.length; i++) {
    svaraList[i].displayLines();
  }
  for (var i = 0; i < svaraList.length; i++) {
    svaraList[i].displaySvara();
  }

  if (loaded) {
    navBox.displayBack();
    navCursor.update();
    navCursor.display();
    navBox.displayFront();
    clock.display();

    if (!paused) {
      currentTime = track.currentTime();
    }

    var x = str(currentTime.toFixed(2));
    currentPitch = pitchTrack[x];
    if (currentPitch != "s" && currentPitch >= minHz && currentPitch <= maxHz) {
      var targetY = map(currentPitch, minHz, maxHz, cursorBottom, cursorTop);
      cursorY += (targetY - cursorY) * easing;
      fill("red");
      stroke(frontColor);
      strokeWeight(1);
      ellipse(melCursorX, cursorY, 5, 5);
    }
  } else if (live) {
    if (currentPitch != "s" && currentPitch >= minHz && currentPitch <= maxHz) {
      var targetY = map(currentPitch, -600, 2000, cursorBottom, cursorTop);
      cursorY += (targetY - cursorY) * easing;
      fill("red");
      stroke(frontColor);
      strokeWeight(1);
      ellipse(melCursorX, cursorY, 5, 5);
    }
  }
}

function startRag () {
  if (loaded) {
    track.stop();
  }
  loaded = false;
  live = true;
  var currentRag = ragInfo[ragMenu.value()];
  pitchSpace = currentRag.pitchSpace
  ragName = currentRag.name + " " + currentRag.nameTrans;
  minHz = pitchSpace[0].cent-100;
  maxHz = pitchSpace[pitchSpace.length-1].cent+100;
  svaraList = [];
  for (var i = 0; i < pitchSpace.length; i++) {
    var svara = new CreateSvara(pitchSpace[i]);
    svaraList.push(svara);
  }
  buttonPlay.attribute("hidden", true);
  recordingsMenu.value("None");
  ragMenu.value("None");
}

function start () {
  live = false;
  if (loaded) {
    track.stop();
  }
  paused = true;
  loaded = false;
  currentTime = 0;
  var currentRecording = recordingsList[recordingsMenu.value()];
  trackFile = currentRecording.recording;
  trackDuration = currentRecording.duration;
  var currentRag = ragInfo[recordingsMenu.value()];
  pitchSpace = currentRag.pitchSpace
  ragName = currentRag.name + " " + currentRag.nameTrans;
  minHz = pitchSpace[0].cent-100;
  maxHz = pitchSpace[pitchSpace.length-1].cent+100;
  svaraList = [];
  for (var i = 0; i < pitchSpace.length; i++) {
    var svara = new CreateSvara(pitchSpace[i]);
    svaraList.push(svara);
  }
  pitchTrack = loadJSON('files/pitchTracks/'+trackFile+'_pitchTrack.json');
  buttonPlay.removeAttribute("hidden");
  buttonPlay.html("Load");

  clock = new CreateClock;

  recordingsMenu.value("None");
  ragMenu.value("None");
}

function CreateNavigationBox () {
  this.x1 = buttonPlay.width + margin * 2;
  this.x2 = width - margin;
  this.y1 = height - margin - navBoxH;
  this.y2 = height - margin;
  this.w = this.x2 - this.x1;

  this.displayBack = function () {
    fill(0, 50);
    noStroke();
    rect(this.x1, this.y1, this.w, navBoxH);
  }

  this.displayFront = function () {
    stroke(0, 150);
    strokeWeight(2);
    line(this.x1+1, this.y1, this.x2, this.y1);
    line(this.x2, this.y1, this.x2, this.y2);
    strokeWeight(1);
    line(this.x1, this.y1, this.x1, this.y2);
    line(this.x1, this.y2, this.x2, this.y2);
  }

  this.clicked = function () {
    if (mouseX > this.x1 && mouseX < this.x2 && mouseY > this.y1 && mouseY < this.y2) {
      jump = map(mouseX, this.x1, this.x2, 0, trackDuration);
      if (paused) {
        currentTime = jump;
      } else {
        track.jump(jump);
        jump = undefined;
      }
    }
  }
}

function CreateNavCursor () {
  this.x = navBox.x1 + navCursorW/2;

  this.update = function () {
    this.x = map(currentTime, 0, trackDuration, navBox.x1+navCursorW/2, navBox.x2-navCursorW/2);
    var noTal = true;
    for (var i = 0; i < talBoxes.length; i++) {
      var talBox = talBoxes[i];
      if (this.x > talBox.x1 && this.x < talBox.x2) {
        talBox.on();
        currentTal = talBox.talIndex;
        talName = talBox.fullName;
        noTal = false;
      } else {
        talBox.off();
      }
    }
    if (noTal) {
      currentTal = undefined;
      talName = undefined;
    }
    if (navBox.x2 - navCursorW/2 - this.x < 0.1) {
      buttonPlay.html(lang_start);
      track.stop();
      paused = true;
      currentTime = 0;
    }
  }

  this.display = function () {
    stroke(frontColor);
    strokeWeight(navCursorW);
    line(this.x, navBox.y1+navCursorW/2, this.x, navBox.y2-navCursorW/2);
  }
}

function CreateSvara (svara) {
  this.x1 = melCursorX;
  this.y = map(svara.cent, minHz, maxHz, cursorBottom, cursorTop);
  this.name = svara.svara;
  this.function = svara.function;
  if (this.function == "sadja") {
    this.radius = svaraRadius1;
    this.extraX = 20;
    this.col = frontColor;
    this.strokeW = 4;
    this.lineW = 4;
    this.txtCol = backColor;
  } else if (this.function == "vadi") {
    this.radius = svaraRadius1;
    this.extraX = 0;
    this.col = backColor;
    this.strokeW = 4;
    this.lineW = 2;
    this.txtCol = frontColor;
  } else if (this.function == "samvadi") {
    this.radius = svaraRadius2;
    this.extraX = 0;
    this.col = backColor;
    this.strokeW = 2;
    this.lineW = 2;
    this.txtCol = frontColor;
  } else {
    this.radius = svaraRadius2;
    this.extraX = 0;
    this.col = color(0, 0);
    this.strokeW = 0;
    this.lineW = 1;
    this.txtCol = frontColor;
  }
  if (svaraList.length == 0) {
    this.position = 0;
  } else if (svaraList[svaraList.length-1].position == 0) {
    this.position = 1;
  } else {
    this.position = 0;
  }
  this.x2 = this.x1 + svaraLine/2 + (svaraRadius1*2 + margin) * this.position;

  this.displayLines = function () {
    stroke(frontColor);
    strokeWeight(this.lineW);
    line(this.x1-svaraLine/2-this.extraX, this.y, this.x2, this.y)
  }

  this.displaySvara = function () {
    stroke(frontColor);
    strokeWeight(this.strokeW);
    fill(this.col);
    ellipse(this.x2 + svaraRadius1, this.y, svaraRadius1, svaraRadius1);

    textAlign(CENTER, CENTER);
    noStroke();
    textSize(svaraRadius1*0.9);//this.radius*0.9);
    textStyle(BOLD);//this.txtStyle);
    fill(this.txtCol);
    text(this.name, this.x2 + svaraRadius1, this.y+this.radius*0.1);
    stroke(frontColor);
    strokeWeight(3);
    fill(backColor);
    textSize(svaraRadius1*0.7);
    textStyle(NORMAL);
    text(this.key, this.x2 + svaraRadius1 + textWidth(this.name), this.y + (svaraRadius1*0.9)/2)
  }
}

function CreateClock () {
  this.clock;
  this.total = niceTime(trackDuration);
  this.now;
  this.display = function () {
    this.now = niceTime(currentTime);
    this.clock = this.now + " / " + this.total;
    textAlign(RIGHT, BOTTOM);
    textSize(12);
    textStyle(NORMAL);
    noStroke();
    fill(frontColor);
    text(this.clock, width - margin, navBox.y1 - margin);
  }
}

function player () {
  if (loaded) {
    if (paused) {
      paused = false;
      if (jump == undefined) {
        track.play();
      } else {
        track.play();
        track.jump(jump);
        jump = undefined;
      }
      buttonPlay.html("Pause");
    } else {
      paused = true;
      currentTime = track.currentTime();
      track.pause();
      buttonPlay.html("Play");
    }
  } else {
    initLoading = millis();
    buttonPlay.html("Loading...");
    buttonPlay.attribute("disabled", "true");
    recordingsMenu.attribute("disabled", "true");
    ragMenu.attribute("disabled", "true");
    track = loadSound("tracks/" + trackFile + '.mp3', soundLoaded, failedLoad);
  }
}

function soundLoaded () {
  buttonPlay.html("Play");
  buttonPlay.removeAttribute("disabled");
  ragMenu.removeAttribute("disabled");
  recordingsMenu.removeAttribute("disabled");
  loaded = true;
  var endLoading = millis();
  print("Track loaded in " + (endLoading-initLoading)/1000 + " seconds");
}

function failedLoad () {
  print("Loading failed");
  failedLoading = true;
}

function mouseClicked () {
  if (loaded) {
    navBox.clicked();
  }
}

function niceTime (seconds) {
  var niceTime;
  var sec = int(seconds%60);
  var min = int(seconds/60);
  niceTime = str(min).padStart(2, "0") + ":" + str(sec).padStart(2, "0");
  return niceTime
}